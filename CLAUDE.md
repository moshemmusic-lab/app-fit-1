# CLAUDE.md — App Fit 1

Normas para Claude Code en este repositorio. Léelas antes de cada tarea.

## Contexto

App móvil (iOS y Android) para registrar entrenamientos de gimnasio, con red social y un marketplace de programas de creadores. Nombre comercial provisional (candidato: Movyn).

Antes de trabajar, lee los documentos que apliquen:
- `docs/PRODUCT.md`: qué construimos y por qué.
- `docs/ARCHITECTURE.md`: stack, modelo de datos y flujos. **Es la referencia técnica.**
- `docs/MVP.md`: alcance y orden de construcción. **No construyas nada fuera de la fase actual.**
- `docs/DESIGN.md` y `docs/design-tokens.json`: marca y sistema de diseño (Movyn). **Referencia para cualquier pantalla.**

El fundador no es programador: explica las decisiones técnicas en lenguaje claro, en español.

## Fase actual

**Fase 1: MVP del tracker.** Pasos 1–9 de `docs/MVP.md` §7.
No implementes pagos, Stripe, RevenueCat, marketplace ni panel de creadores hasta que se indique.

## Stack (no lo cambies sin proponerlo y explicar el impacto)

- Monorepo: pnpm + Turborepo → `apps/mobile` (Expo + Expo Router), `apps/web` (Next.js), `packages/shared`, `supabase/`.
- TypeScript en modo `strict` en todo. Prohibido `any` salvo justificación en un comentario.
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions), región UE.
- Datos en el móvil: TanStack Query (servidor), Zustand (estado de la app), expo-sqlite (entrenos sin conexión).
- Validación: Zod. Los esquemas viven en `packages/shared` y los usan la app, la web y las funciones.
- Tests: Vitest (lógica), tests de RLS (base de datos), Maestro (end-to-end móvil).

## Reglas de datos (no negociables)

1. **Todo cambio de base de datos va en una migración** nueva en `supabase/migrations/`. Nunca edites una migración ya aplicada.
2. **RLS activada en todas las tablas**, con políticas explícitas y tests que comprueben quién puede leer y escribir.
3. La clave `service_role` solo se usa en Edge Functions. Nunca en la app ni en el navegador.
4. **Peso siempre en kg** en la base de datos; la conversión a lb se hace en la interfaz. Importes en céntimos (`*_cents`) con su `currency`.
5. **Lo planificado (`prescriptions`, `routine_sets`) nunca se mezcla con lo realizado (`workout_sets`).**
6. Las versiones de programa publicadas son inmutables.
7. Los entrenos se crean en el móvil con UUID propio y se sincronizan con upserts idempotentes. **Nunca se puede perder un entreno**: ante la duda, conservar los datos.
8. `discipline` existe en `programs`, `routines` y `workouts` (y `disciplines[]` en `exercises`), pero en el MVP solo se usa `gym`. No construyas pantallas ni lógica para otras disciplinas.
9. Tras cambiar el esquema, regenera los tipos (`supabase gen types`) en `packages/shared`.

## Convenciones de código

- Código, nombres de tablas, variables y commits en **inglés**. Textos visibles para el usuario en **español**, siempre mediante i18n (nunca texto fijo en los componentes).
- Organización por funcionalidad: `apps/mobile/features/<feature>/` (componentes, hooks, api, tipos).
- Componentes pequeños y reutilizables; nada de duplicar lógica que pueda vivir en `packages/shared`.
- Diseño: sigue `docs/DESIGN.md` (guía de marca) y `docs/design-tokens.json` (colores en tema oscuro y claro, tipografías, espaciados, radios). Convierte esos tokens en el tema de la app (`packages/shared/theme`) y úsalos siempre: ningún color, tamaño ni espaciado escrito a mano en los componentes. Modo oscuro por defecto, zonas táctiles de 44 px como mínimo, uso con una mano. El lima es solo relleno, nunca texto sobre fondo claro.
- Gestiona errores y estados de carga, vacío y sin conexión en cada pantalla.
- Ningún secreto en el repositorio: usa `.env` (ignorado por git) y añade `.env.example`.

## Cómo trabajar

Para cada funcionalidad:
1. Lee lo que ya existe y los documentos relevantes.
2. Explica el plan en pocas líneas: qué tablas, qué pantallas, qué dependencias y criterios de aceptación.
3. Implementa de punta a punta: migración → tipos → lógica → pantalla → tests.
4. Ejecuta typecheck, lint y tests. **No digas que algo funciona si no lo has ejecutado**; indica qué no se pudo probar.
5. Resume qué cambió, cómo probarlo en el móvil y qué queda pendiente.

- Commits pequeños y descriptivos (Conventional Commits: `feat:`, `fix:`, `chore:`…). Trabaja en ramas, no en `main`.
- Si una petición contradice los documentos, avisa y propón cómo resolverlo antes de cambiar nada.
- Cuando se tome una decisión importante, actualiza el documento correspondiente en `docs/`.

## Comandos

Desde la raíz del repositorio, la carpeta `app-fit-1` (requiere Node 24 y pnpm vía `corepack enable pnpm`). Desde la carpeta superior pnpm no encuentra los binarios y falla con `expo: command not found`:

- `pnpm install`: instalar dependencias.
- `pnpm dev`: arrancar todo (app móvil y web).
- `pnpm --filter mobile start`: app móvil con Expo (escanear el QR con la cámara del iPhone y abrir en Expo Go). Expo Go solo abre el proyecto si el iPhone (Expo Go → Log in) y el Mac (`npx expo login`) tienen sesión con la misma cuenta de Expo; comprobar con `npx expo whoami`.
- `pnpm --filter web dev`: web en http://localhost:3000.
- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm format` (Prettier).
- `pnpm tokens`: regenera el tema (`packages/shared/src/theme/tokens.generated.ts`) tras editar `docs/design-tokens.json`. Un test falla si no están sincronizados.
- `pnpm db:start`: base de datos local (requiere Docker) · `pnpm db:reset`: aplicar migraciones y datos iniciales · `pnpm db:test`: tests de base de datos (RLS) · `pnpm db:types`: regenera `packages/shared/src/database.types.ts` (el CI falla si no está al día).
- Emails en local (códigos de inicio de sesión): no salen a internet, se ven en http://127.0.0.1:54324.
- Variables de entorno de la app móvil: `apps/mobile/.env` (copiar de `apps/mobile/.env.example` con los valores de `pnpm db:start`).
- Dependencias de la app móvil: instalar siempre con `npx expo install <paquete>` desde `apps/mobile` (elige versiones compatibles con Expo Go).

## Notas técnicas del monorepo

- `apps/mobile` usa Expo SDK 58: Expo Go en el iPhone solo abre la última versión del SDK. Si una librería necesita código nativo que no está en Expo Go, hará falta una development build (avisar antes).
- `pnpm-workspace.yaml` usa `nodeLinker: hoisted` y fija una única versión de React para Expo y Next.
- Tema: `@app-fit/shared/theme` (colores por modo, tipografía, espaciado, radios y tamaños). En el móvil, `useTheme()` y los componentes de `components/ui`; en la web, variables CSS (`--color-bg`, `--space-4`…).
- Textos: `packages/shared/src/i18n/locales/es.ts`. En el móvil se usan con `useTranslation()` (claves con tipos).
- Rutas del móvil en inglés: `app/(tabs)/index` (Inicio), `workout`, `programs`, `progress`, `profile`, más `sign-in`, `verify-code`, `onboarding`, `edit-profile`, `settings`, `exercises` (biblioteca), `exercises/[id]` (ficha), `exercises/edit` (crear o, con `?id=`, editar un ejercicio personalizado), `exercises/pick` (añadir o sustituir ejercicios del entreno o, con `?for=routine`, de la rutina), `active-workout` (entreno en curso), `workout-summary`, `routine-editor` (crear o, con `?id=`, editar una rutina), `history` (todos los entrenos), `workouts/[id]` (ficha de un entreno terminado) y `body-weight` (peso corporal). `app/_layout.tsx` decide qué parte es accesible con `Stack.Protected` (sin sesión → entrar; sin onboarding → onboarding; si no → la app).
- Datos del servidor con TanStack Query (`features/<feature>/api.ts`); la caché se guarda en el móvil para abrir sin conexión. Errores de Supabase → mensajes con `useErrorMessage()`.
- Biblioteca de ejercicios: la crean y la amplían migraciones (no `seed.sql`), una nueva por cambio, que localizan cada ejercicio por su `slug`. Los textos se escriben para Movyn: nunca se copian de otra app. Los músculos, el material y los tipos de registro son enumerados de Postgres y sus nombres en español están en `es.ts` (`muscles`, `equipment`, `trackingTypes`); un test falla si falta alguno.
- Entrenos (regla 7, nunca perder uno): el entreno en curso y la cola de subida viven en `features/workouts/workout-store.ts`, que se escribe en SQLite tras cada cambio. La lógica pura (qué se sube y el resumen) está en `finish.ts`, con tests. Subir es siempre `save_workout()`, que es idempotente. Un entreno solo sale de la cola cuando el servidor confirma; ante un error de conexión se reintenta, nunca se borra.
- Descanso: se guarda como hora de fin (`restTimer.endsAt`), así sigue contando con la app cerrada. Lo avisa una notificación local programada (`features/workouts/rest-timer.ts`, funciona en Expo Go); con la app abierta, la barra y una vibración. El descanso de cada ejercicio se recuerda por usuario. Las hojas de opciones usan `components/ui/OptionsSheet` (las alertas de Android solo admiten tres botones).
- Rutinas: se leen con `useRoutineLibrary` (en caché, se empiezan sin conexión) y se guardan enteras con `save_routine()`. Editar necesita conexión: las mutaciones usan `networkMode: 'always'` para fallar enseguida y decirlo. El editor trabaja sobre un borrador en memoria (`routine-draft-store.ts`) que comparte con el selector de ejercicios.
- Pantallas para crear o elegir (crear rutina, añadir ejercicios): barra `components/ui/ModalHeader` con «Cancelar», título y la acción («Guardar», «Crear») arriba. El selector de ejercicios (`ExerciseLibraryView`) filtra con dos botones que abren hojas (`FilterSheet`, músculos agrupados en `muscleRegions`), pone arriba los «Recientes» (`useRecentExerciseIds`, de los últimos entrenos más los pendientes) y cada fila tiene un botón (i) a la ficha. Todos los marcos usan `radius.md`; `radius.pill` solo para lo redondo (avatares, puntos, barras).
- Ejercicios personalizados: viven en la misma biblioteca (`isCustom`); los borrados (`deleted`) se ocultan en la biblioteca y el selector, pero se siguen mostrando en entrenos y rutinas. Se guardan con `save_custom_exercise()`; editarlos necesita conexión, como las rutinas.
- Progreso: el historial, el volumen semanal y el calendario salen de la vista `workout_stats` más los entrenos pendientes de subir (`features/progress/api.ts`, `useTrainingLog`). Los récords los calcula la base de datos; el resumen los calcula también en el móvil con las mismas reglas (`packages/shared/src/progress`), así funciona sin conexión: si cambias una regla, cámbiala en los dos sitios y en sus tests. Las gráficas se dibujan con `react-native-svg` (`components/charts`), con el color `accentText`.
- Para aplicar migraciones nuevas en local sin borrar las cuentas de prueba: `pnpm exec supabase migration up --local` (`pnpm db:reset` lo borra todo).
