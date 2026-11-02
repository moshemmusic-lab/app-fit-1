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

## Comandos (actualizar cuando existan)

- `pnpm install`: instalar dependencias.
- `pnpm dev`: arrancar todo.
- `pnpm --filter mobile start`: app móvil con Expo.
- `pnpm typecheck` · `pnpm lint` · `pnpm test`
- `supabase start`: base de datos local · `supabase db reset`: aplicar migraciones y datos iniciales.
