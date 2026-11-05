# ARCHITECTURE.md — App Fit 1

> **Cómo está construida la aplicación por dentro.** Tecnologías, base de datos, usuarios, pagos y cómo se conectan las piezas.
> Última actualización: 05/11/2026. Documentos relacionados: [PRODUCT.md](./PRODUCT.md) y [MVP.md](./MVP.md).

---

## 1. Visión general

Un único código móvil para iOS y Android (Expo / React Native), una web para creadores y landings (Next.js) y un solo backend (Supabase). Todo en **TypeScript**, para que la app, la web y el servidor compartan los mismos tipos y Claude Code pueda construir cada funcionalidad de punta a punta.

```
 ┌───────────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
 │  App móvil        │   │  Panel de creadores  │   │  Landings de venta   │
 │  Expo · iOS/And.  │   │  Next.js (web)       │   │  Next.js (web, SEO)  │
 └─────────┬─────────┘   └──────────┬──────────┘   └──────────┬───────────┘
           │                        │                         │
 ┌─────────▼────────────────────────▼─────────────────────────▼───────────┐
 │  Supabase · región UE                                                  │
 │  Auth · Postgres + RLS · Storage (vídeos, fotos) · Edge Functions      │
 └─────────┬────────────────────────┬─────────────────────────┬───────────┘
           │                        │                         │
 ┌─────────▼─────────┐   ┌──────────▼──────────┐   ┌──────────▼───────────┐
 │  RevenueCat       │   │  Stripe Connect      │   │  PostHog · Sentry    │
 │  Pro in-app       │   │  Venta web y cobros  │   │  Analítica y errores │
 └───────────────────┘   └─────────────────────┘   └──────────────────────┘
```

Referencia: Hevy está construida con React Native y TypeScript y escala a millones de usuarios.

## 2. Stack

| Capa | Tecnología | Motivo |
| --- | --- | --- |
| App móvil | Expo (React Native) + TypeScript, Expo Router, EAS Build / Submit / Update | Un código para iOS y Android; publicación y actualizaciones sencillas |
| Datos locales | expo-sqlite + cola de sincronización | El entreno funciona sin conexión |
| Estado | TanStack Query (servidor) + Zustand (estado de la app) | Caché, reintentos y estado simple |
| UI | Componentes propios con un sistema de diseño (tokens), modo oscuro por defecto | Rapidez y coherencia |
| Validación | Zod (esquemas compartidos app/web/funciones) | Una sola definición de cada entidad |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions (Deno), región UE | Seguridad por filas (RLS), RGPD, sin servidores propios |
| Web | Next.js en Vercel | Panel de creadores, landings con SEO y checkout |
| Pagos | Stripe Connect (marketplace) + RevenueCat (suscripción Pro) | Repartos a creadores; suscripciones de las tiendas |
| Notificaciones | Expo Notifications | Avisos de compra, comentarios y PRs |
| Analítica y errores | PostHog + Sentry | Embudos, retención y fallos |
| Idiomas | i18next | Español primero, preparado para LatAm e inglés |
| Repositorio | Monorepo con pnpm + Turborepo | Tipos y lógica compartidos |
| CI | GitHub Actions | Tipos, lint y tests en cada cambio |

## 3. Estructura del repositorio

```
app-fit-1/
├── CLAUDE.md                 # Convenciones para Claude Code
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   └── MVP.md
├── apps/
│   ├── mobile/               # Expo (Expo Router)
│   │   ├── app/              # Pantallas: (tabs)/index (inicio), workout, programs, progress, profile
│   │   ├── features/         # workout, routines, programs, social, progress, auth
│   │   ├── db/               # SQLite local + cola de sincronización
│   │   ├── components/       # ui/ (Text, Screen, Chip…) con el tema compartido
│   │   └── theme/            # Proveedor del tema y fuentes (Barlow Condensed, Inter)
│   └── web/                  # Next.js
│       ├── app/(creator)/    # Panel de creadores
│       ├── app/p/[slug]/     # Landing pública de cada programa + checkout
│       └── app/(admin)/      # Revisión de creadores, programas y denuncias
├── packages/
│   └── shared/               # Tema (generado desde design-tokens.json), i18n, tipos de la BD, esquemas Zod, progresión, 1RM
└── supabase/
    ├── migrations/           # SQL versionado (única forma de cambiar la BD), incluida la biblioteca de ejercicios
    ├── functions/            # Edge Functions: stripe-webhook, revenuecat-webhook, export-data, delete-account…
    ├── tests/database/       # Tests pgTAP (RLS activada en todas las tablas, políticas)
    └── seed.sql              # Datos de prueba solo para local
```

## 4. Usuarios, cuentas y permisos

**Inicio de sesión:** email con código de 6 dígitos (sin contraseña), Apple y Google con Supabase Auth. Apple exige ofrecer un inicio de sesión equivalente centrado en la privacidad si hay otros inicios sociales, y Sign in with Apple lo cumple.

- **Email:** `signInWithOtp` envía un código y la app lo verifica con `verifyOtp`. Sin enlaces que abran la app, así funciona igual en Expo Go y en las builds.
- **Apple:** inicio nativo (`expo-apple-authentication` + `signInWithIdToken` con nonce). En desarrollo el `client_id` es `host.exp.Exponent` (Expo Go); con las builds propias se añade el bundle id de la app.
- **Google:** se activa en el paso 9 (beta). Necesita una development build (no funciona en Expo Go) y un proyecto de Supabase accesible desde internet.
- La sesión se guarda en el móvil (`expo-sqlite/localStorage`) y la caché de TanStack Query también, para abrir la app sin conexión.

**Roles**
| Rol | Cómo se obtiene | Puede |
| --- | --- | --- |
| `user` | Al registrarse | Entrenar, seguir, compartir y comprar |
| `creator` | Solicitud aprobada por admin (`creators.status = approved`) | Lo anterior + crear y vender programas, ver sus ventas |
| `admin` | Asignado a mano | Aprobar creadores y programas, moderar, gestionar reembolsos |

**Seguridad por filas (RLS):** activada en **todas** las tablas. Cada usuario solo lee y escribe lo suyo, salvo lo que otros han hecho visible. Ejemplos:
- `workouts`: leer si es tuyo, si es público, o si es «solo seguidores» y le sigues.
- `prescriptions` (contenido de un programa): leer solo si tienes un `entitlement` de esa versión, o si la sesión está marcada como muestra.
- `purchases` y `payouts`: solo el propio usuario, el creador correspondiente y los administradores.
- La clave de servicio (`service_role`) solo se usa dentro de las Edge Functions, nunca en la app ni en el navegador.

## 5. Modelo de datos

Convenciones: claves `uuid`; `created_at` / `updated_at` en todo; borrado lógico (`deleted_at`) en el contenido del usuario; **el peso siempre se guarda en kg** y la conversión a lb se hace en la interfaz; los importes en **céntimos** (`*_cents`) con su `currency`.

### 5.1 Usuarios y social
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `profiles` | Perfil público de cada usuario (1:1 con `auth.users`); lo ve cualquier usuario con sesión | username, display_name, avatar_path, bio, is_private, role |
| `user_settings` | Preferencias y consentimientos privados (1:1 con `auth.users`); solo los ve su dueño | units (kg/lb), locale, training_goal, experience_level, default_workout_visibility, notify_social, notify_reminders, health_data_consent_at, onboarding_completed_at |
| `follows` | Quién sigue a quién | follower_id, following_id, status (pending/accepted para perfiles privados), accepted_at |
| `blocks` | Personas bloqueadas: ninguna ve a la otra (obligatorio en la App Store, guía 1.2) | blocker_id, blocked_id |
| `likes`, `comments` | Interacción con entrenos compartidos | user_id, workout_id, body (máx. 500) |
| `reports` | Denuncias de entrenos, comentarios y usuarios; se revisan en Supabase hasta el panel de moderación (paso 16) | reporter_id, target_type, target_id, target_user_id, reason, details, status |

**Social (paso 7).**
- **Quién ve qué, en un solo sitio:** `can_view_content(lector, dueño, visibilidad)`.
  - Privado: solo el dueño.
  - Seguidores: también los seguidores aceptados.
  - Público: cualquiera con sesión, salvo que el perfil sea privado (entonces solo los seguidores).
  - Bloquear oculta a las dos personas entre sí.
- Las tablas de entrenos y rutinas siguen siendo legibles solo por su dueño, así las consultas propias de la app no cambian. Lo compartido se lee con funciones `security definer` que aplican esa regla y dan los nombres de los ejercicios, también los personalizados del dueño: `get_feed`, `get_workout_detail`, `get_workout_social`, `get_comments`, `get_profile`, `search_users` y `get_user_routines`.
- **Todo se escribe con funciones:**
  - seguir y responder solicitudes: `follow_user`, `unfollow_user`, `respond_to_follow_request`, `remove_follower`;
  - bloquear: `block_user`, `unblock_user`;
  - interactuar: `set_workout_like`, `add_comment`, `delete_comment`;
  - visibilidad: `set_workout_visibility`, `set_routine_visibility`;
  - denunciar y copiar: `report_content`, `copy_routine`.
- Las tablas solo dejan leer las filas propias (RLS).
- Seguir a un perfil privado crea una solicitud. Al hacer público el perfil, se aceptan las que esperaban. Bloquear corta los seguimientos en los dos sentidos.
- Un comentario lo pueden borrar su autor y el dueño del entreno. Los comentarios de personas bloqueadas no se muestran.

### 5.2 Ejercicios
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `exercises` | Biblioteca global y ejercicios personalizados | slug (solo los globales), tracking_type (weight_reps, bodyweight_reps, duration, distance_duration, calories_duration), **disciplines[]**, primary_muscle, secondary_muscles[], equipment, owner_id (null = global) |
| `exercise_translations` | Nombre e instrucciones por idioma y país | exercise_id, locale («es-ES», «es-MX»), name, aliases[], instructions[] (un paso por elemento) |

El `tracking_type` decide qué campos de la serie se usan. Así el mismo modelo sirve para fuerza, cardio y, en el futuro, otros deportes.

- Tipo de registro, músculos, material y disciplina son tipos enumerados de Postgres. Los tipos generados para TypeScript (`packages/shared`) salen de ellos, así que la app y la base de datos no se desincronizan.
- **La biblioteca global llega por migraciones**, no por `seed.sql`, para que exista igual en local, staging y producción. Cada ejercicio global tiene un `slug` estable: para añadir o corregir ejercicios se escribe una migración nueva que los busca por `slug`.
- Cualquier usuario con sesión lee los globales y los suyos. Los globales son de solo lectura.
- **Ejercicios personalizados** (paso 5): una fila con `owner_id` del usuario, sin `slug`, y una traducción con su nombre. Solo los ve su dueño. Se crean y editan con `save_custom_exercise(jsonb)` (el id lo genera el móvil, así un reintento no crea dos). Su `tracking_type` no se puede cambiar después de crearlo, para no estropear las series ya registradas. Editarlos necesita conexión.
- **Borrar un ejercicio personalizado es un borrado lógico** (`deleted_at`): desaparece de la biblioteca y del selector, pero los entrenos y rutinas que lo usan lo conservan con su nombre. Los globales no se pueden borrar desde la app.
- Las referencias de `workout_exercises` y `routine_exercises` a `exercises` se comprueban al final de la transacción (`deferrable initially deferred`): así borrar una cuenta, que borra a la vez sus ejercicios, entrenos y rutinas, funciona; y borrar de verdad un ejercicio que aún usa un entreno sigue siendo imposible.
- La app descarga la biblioteca entera (unos 150 ejercicios), la guarda en el móvil y busca allí: funciona sin conexión. La búsqueda ignora tildes y mayúsculas y mira nombre, otros nombres, músculo y material.
- Las imágenes y los vídeos todavía no están: se añadirán con una migración (columna de medios) cuando se decida su origen (§12).

### 5.3 Rutinas
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `routine_folders` | Carpetas | owner_id, name, position |
| `routines` | Plantilla de entreno propia o copiada | owner_id, folder_id, name, **discipline**, notes, visibility, copied_from_routine_id |
| `routine_exercises` | Ejercicios de la rutina | routine_id, exercise_id, position, superset_group, rest_seconds |
| `routine_sets` | Series objetivo | routine_exercise_id, position, set_type, target_reps, target_weight_kg, target_duration_s, target_distance_m |

- Existen desde el paso 5. Las rutinas nuevas son privadas (`visibility = 'private'`). Desde el paso 7 se pueden compartir en el perfil (`set_routine_visibility`) y otros las copian con `copy_routine`, que guarda `copied_from_routine_id`. Si usa ejercicios personalizados del dueño, quien copia recibe su propia copia de cada uno (`exercises.copied_from_exercise_id`), que se reutiliza en copias posteriores.
- **Una rutina se guarda entera con `save_routine(jsonb)`**, como los entrenos: sustituye sus ejercicios y series de una vez y comprueba que la carpeta y los ejercicios son del usuario. Moverla de carpeta, reordenarla y borrarla (borrado lógico con `deleted_at`) se hace directamente, limitado por privilegios por columna y RLS. Las carpetas las gestiona su dueño directamente.
- Una rutina solo puede ir a una carpeta de su dueño (clave foránea compuesta). Al borrar una carpeta, sus rutinas se quedan sin carpeta.
- `workouts.routine_id` recuerda la rutina con la que se empezó un entreno; si la rutina se borra, el entreno se conserva.
- **Editar rutinas necesita conexión; empezarlas, no.** La lista de rutinas está en la caché del móvil, así que un entreno desde una rutina se empieza en el sótano. Al empezar, cada serie sugiere lo de la última vez y, si no hay, el objetivo de la rutina.

### 5.4 Entrenos (lo que el usuario hace)
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `workouts` | Una sesión de entreno | id (generado en el móvil), user_id, **discipline**, **source** (app/imported), external_id, routine_id, enrollment_id, program_session_id, title, started_at, ended_at, notes, visibility |
| `workout_exercises` | Ejercicios hechos en la sesión | workout_id, exercise_id, position, superset_group, notes |
| `workout_sets` | Cada serie realizada | workout_exercise_id, position, set_type (warmup/normal/drop/failure), weight_kg, reps, duration_s, distance_m, calories, rpe, completed_at, **prescription_id** |
| `personal_records` | Cada vez que una serie batió el mejor valor del usuario en un ejercicio | user_id, exercise_id, workout_id, workout_set_id, record_type (est_1rm, max_weight, max_volume, max_reps, max_duration, max_distance), value, previous_value, achieved_at |
| `body_measurements` | Peso corporal, uno por día | user_id, measured_on, weight_kg |

- `workouts`, `workout_exercises` y `workout_sets` existen desde el paso 4; `routine_id`, desde el paso 5. `enrollment_id`, `program_session_id` y `prescription_id` se añadirán con sus tablas (paso 10). `personal_records` y `body_measurements` existen desde el paso 6.
- `workouts` lleva `deleted_at` (borrado lógico, contenido del usuario).
- **La app no escribe estas tablas directamente:** envía el entreno terminado entero a la función `save_workout(jsonb)`, que sustituye lo guardado antes con ese id. Subir dos veces el mismo entreno deja una sola copia, y la función comprueba que el entreno es del usuario y que los ejercicios son globales o suyos.
- Cada usuario solo lee directamente sus entrenos. Desde el paso 7, lo que comparte según `visibility` lo leen otros a través de las funciones sociales (§5.1). La visibilidad se elige en el resumen y se puede cambiar después.
- **Borrar un entreno del historial** es un borrado lógico con `delete_workout(id)`, que además recalcula los récords. Necesita conexión. Un entreno que aún no se ha subido no se puede borrar desde el historial (se perdería).

**Récords (paso 6).** Los calcula la base de datos (`refresh_personal_records`, interna) cada vez que `save_workout()` o `delete_workout()` cambian un entreno, recalculando desde cero los ejercicios afectados. Reglas:
- Fuerza: 1RM estimado (fórmula de Epley, solo series de 1 a 12 repeticiones; con 1 repetición es el propio peso), peso máximo y mejor serie (peso × repeticiones). Peso corporal: más repeticiones y más lastre. Isométricos: más tiempo. Cardio con distancia: más distancia. Cardio con calorías: sin récords.
- Los calentamientos y los entrenos borrados no cuentan. Cada entreno cuenta su mejor serie de cada tipo (la primera si empatan), y es récord si supera a los entrenos anteriores; empatar no es récord.
- La primera vez que se hace un ejercicio se guarda como punto de partida (`previous_value` vacío) y no se celebra.
- El móvil aplica las mismas reglas (`packages/shared/src/progress/records.ts`) para enseñar los récords en el resumen **sin conexión**, comparando con `personal_bests` (vista con el mejor valor de cada ejercicio, guardada en la caché) y con los entrenos que aún no se han subido. Hay tests con los mismos números en los dos lados.

**Estadísticas.** La vista `workout_stats` (con `security_invoker`, así respeta RLS) da una fila por entreno no borrado con su volumen (peso × repeticiones de las series que no son de calentamiento; en peso corporal solo el lastre), series, ejercicios y récords. El historial, el volumen semanal, el calendario de constancia y el contador del perfil salen de ella, más los entrenos pendientes de subir. Las semanas van de lunes a domingo en la hora del móvil. Supabase devuelve como mucho 1.000 filas por consulta: años de historial; si hiciera falta más, se paginará.

**Peso corporal.** Un registro por día (`unique (user_id, measured_on)`): guardar otra vez el mismo día lo sustituye. Lo escribe la app directamente, limitada por privilegios por columna y RLS, y se borra de verdad (nada más lo usa). Necesita conexión, como las rutinas. Las demás medidas y las fotos de progreso son de la V2.

### 5.5 Creadores y programas (lo planificado)
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `creators` | Datos del creador | profile_id, status (applied/approved/suspended), stripe_account_id, payouts_enabled, commission_rate (0,20 por defecto), founder_terms |
| `programs` | Producto a la venta | creator_id, slug, **discipline**, status (draft/in_review/published/archived), current_version_id, price_cents, currency, goal, level, days_per_week, duration_weeks, equipment[], tags[], cover_url |
| `program_versions` | Versión **inmutable** una vez publicada | program_id, version_number, title, description, changelog, published_at |
| `program_weeks` | Semanas de una versión | version_id, week_number, notes |
| `program_sessions` | Días o sesiones | week_id, day_number, title, notes, is_sample |
| `prescriptions` | Lo que indica el programa para cada ejercicio | session_id, exercise_id, position, superset_group, sets, reps_min, reps_max, load_type (kg, %1RM, RPE, peso corporal), load_value, rest_seconds, progression_rule (jsonb), notes |

### 5.6 Comercio
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `purchases` | Cada compra | user_id, program_id, version_id, channel (web/ios/android), amount_cents, store_fee_cents, platform_fee_cents, creator_amount_cents, tax_cents, currency, status (pending/paid/refunded), external_id |
| `entitlements` | **Qué programa y qué versión puede usar cada usuario** | user_id, program_id, version_id, purchase_id, source (purchase/gift/pilot), revoked_at |
| `program_enrollments` | Un usuario siguiendo un programa | user_id, program_id, version_id, start_date, status (active/paused/completed/abandoned), current_week, current_day |
| `reviews` | Reseñas verificadas | program_id, user_id, enrollment_id, rating, body |
| `payouts` | Pagos a creadores | creator_id, period, amount_cents, stripe_transfer_id, status |
| `subscriptions` | Copia del estado del Pro | user_id, provider, plan (monthly/yearly/lifetime), status, current_period_end |
| `audit_logs` | Registro de eventos críticos | actor_id, action, entity, entity_id, data (jsonb) |

### 5.7 Reglas del modelo
1. **Plan y resultado, por separado.** `prescriptions` (lo planificado) nunca se mezcla con `workout_sets` (lo hecho). La serie hecha apunta a su `prescription_id`, y así se mide el progreso real frente al plan.
2. **Versiones inmutables.** Editar un programa publicado crea una versión nueva en borrador. Los `entitlements` y `enrollments` apuntan a una versión concreta, así que el comprador nunca pierde lo que compró.
3. **El acceso lo da el entitlement, no la compra.** Así se pueden dar programas piloto gratis, regalos o reembolsos (revocando el entitlement) sin tocar la lógica de la app.
4. **Pro y programas son independientes.** `is_pro(user_id)` controla las funciones Pro; nunca bloquea un entitlement.
5. **Disciplinas preparadas desde el inicio.** `discipline` es un tipo enumerado de Postgres en `programs`, `routines` y `workouts`, y una lista (`disciplines[]`) en `exercises`, porque un ejercicio como la plancha sirve en gimnasio y en pilates. En el MVP solo existe el valor `gym` (fuerza y cardio de gimnasio). Valores previstos: `yoga`, `pilates`, `mobility`, `calisthenics`, `running`, `cycling`. Añadir una disciplina = añadir un valor al tipo, ejercicios y, si hace falta, pantallas, sin migrar datos existentes.
6. **Actividades importadas.** `workouts.source = imported` y `external_id` permiten traer más adelante carreras o paseos desde Apple Health, Health Connect o Strava sin desarrollar GPS propio. `external_id` es único por usuario para no duplicar importaciones.

## 6. Flujos clave

### 6.1 Registrar un entreno (sin conexión primero)
1. Al empezar, la app crea el entreno en **SQLite local** con un UUID generado en el móvil.
2. Rellena cada ejercicio con los valores de la última vez (o con la prescripción si es un programa).
3. Cada serie marcada se guarda en local al instante y lanza el temporizador de descanso. No hace falta conexión.
4. Al terminar, la **cola de sincronización** sube el entreno completo a Supabase con una operación idempotente (upsert por id). Si no hay red, reintenta más tarde.
5. En el servidor, `save_workout()` recalcula los récords de los ejercicios del entreno; las estadísticas salen de la vista `workout_stats`. El entreno aparecerá en el feed según su visibilidad (paso 7).
6. Conflictos: el móvil es la fuente de verdad del entreno en curso; en ediciones posteriores gana el cambio más reciente (`updated_at`).

### 6.2 Una rutina comprada aparece en el perfil del comprador (venta web, canal principal)
1. El creador comparte `{dominio}/p/{slug}` (dominio pendiente), una landing de Next.js con la ficha y la semana de muestra.
2. El comprador paga con **Stripe Checkout**. Stripe Connect separa la comisión de la plataforma (20 %) y el importe del creador.
3. Stripe envía el evento `checkout.session.completed` a la Edge Function `stripe-webhook`, que:
   - verifica la firma del evento;
   - en **una sola transacción** crea la `purchase` (paid) y el `entitlement` de la versión publicada;
   - anota el evento en `audit_logs`.
4. Si el comprador no tenía cuenta, se le crea con su email (enlace mágico) y se le invita a descargar la app.
5. Al abrir la app, la sección «Mis programas» consulta sus `entitlements`: **el programa ya está ahí**, sin hacer nada más. Además, recibe una notificación.
6. Elige la fecha de inicio → se crea el `program_enrollment` → las sesiones aparecen en su calendario.

### 6.3 Compra dentro de la app
- Las compras digitales dentro de la app pasan por la tienda (Apple / Google), gestionadas con RevenueCat.
- Los programas se venden como productos por **tramo de precio**, porque las tiendas trabajan con precios predefinidos. El webhook de RevenueCat crea la `purchase` y el `entitlement`, igual que en 6.2.
- ⚠️ El modelo exacto (tipo de producto, tramos y si se permite enlazar a la compra web) hay que validarlo con las normas vigentes de Apple y Google y con un asesor antes de construirlo.

### 6.4 Entrenar un programa
1. La app calcula la sesión de hoy a partir de `start_date` y el avance del `enrollment`.
2. Genera el entreno a partir de las `prescriptions` de la versión comprada y calcula los pesos (por ejemplo, el 75 % de tu 1RM estimado).
3. Cada serie guardada enlaza su `prescription_id`; al terminar se actualiza el avance (`current_week`, `current_day`).
4. El entreno aparece en el feed de la **cohorte** del programa si la privacidad del usuario lo permite.

### 6.5 Suscripción Pro
- En el móvil: el SDK de RevenueCat gestiona la compra en App Store y Google Play.
- El webhook de RevenueCat actualiza `subscriptions`; la función `is_pro(user_id)` decide qué funciones se desbloquean.
- Más adelante, venta del Pro en la web (Hevy también lo vende desde su web).

### 6.6 Un creador publica un programa
1. En el panel web construye la versión en borrador (semanas → sesiones → prescripciones) y marca qué sesión es de muestra.
2. La envía a revisión (`in_review`) → un admin la aprueba → la versión se publica y queda **inmutable**.
3. Para cambiarla, crea una versión nueva; los compradores anteriores conservan la suya.

### 6.7 Feed, cohortes y rankings
- **Feed de inicio:** tus entrenos y los de la gente que sigues, según su visibilidad, del más reciente al más antiguo, de 20 en 20 (`get_feed`). Me gusta al instante en la pantalla (se confirma después) y comentarios en su propia pantalla. Avisos en el móvil: antes de la beta (paso 9), con una development build.
- **Compartir en stories (paso 8):** la pantalla `share/[workoutId]` dibuja una imagen de 360 × 640 puntos (1080 × 1920 píxeles en un móvil 3x) siempre en el tema oscuro, con el logo, la fecha, el @usuario y las unidades del usuario. Dos diseños: el entreno (título, duración, volumen, series y ejercicios) o el récord más destacado (el que más mejora el anterior), solo si el entreno batió alguno. Fondo Movyn o una foto de la galería, oscurecida para que el texto se lea. `react-native-view-shot` la convierte en PNG; `expo-sharing` abre el menú del móvil y `expo-media-library` la guarda en Fotos (solo pide permiso para añadir, no para leer la fototeca). No toca la base de datos ni sube nada. Funciona en Expo Go; el botón directo a Instagram Stories necesita una development build.
- **Feed de la cohorte:** entrenos vinculados a un `enrollment` del mismo programa.
- **Ranking semanal de la cohorte:** vista materializada que se recalcula periódicamente.

## 7. Seguridad, privacidad y RGPD

- Datos alojados en la **región UE** de Supabase.
- El historial de entrenos y las medidas pueden considerarse **datos de salud**: consentimiento explícito en el onboarding (`health_data_consent_at`).
- RLS en todas las tablas; nada sensible se lee sin pasar por ella.
- Claves y secretos en Supabase Secrets, EAS Secrets y Vercel, nunca en el repositorio.
- **Exportar datos** (Edge Function `export-data`, JSON y CSV) y **borrar cuenta** desde la app (`delete-account`): se borra el contenido del usuario y se anonimizan las compras que deban conservarse por contabilidad.
- **Privacidad por defecto** (RGPD art. 25): los entrenos nuevos son «solo seguidores» salvo que el usuario elija otra cosa (`user_settings.default_workout_visibility`).
- Las filas de `profiles` y `user_settings` las crea un trigger al registrarse. Desde la app solo se pueden editar las columnas permitidas (privilegios por columna): nadie puede cambiar su `role` ni escribir la fecha de consentimiento, que solo registra `complete_onboarding()` con la hora del servidor.
- Fotos de perfil en el bucket público `avatars`, cada usuario solo escribe en su carpeta (`<user_id>/…`); en la base de datos se guarda la ruta (`avatar_path`), no la URL.
- Copias de seguridad automáticas (restauración a un punto en el tiempo en el plan de pago de Supabase).
- Webhooks siempre con verificación de firma e idempotencia (un mismo evento nunca crea dos compras).
- Registro en `audit_logs` de pagos, reembolsos, cambios de programa y acciones de administración.

## 8. Idiomas, unidades y monedas

- Textos de la interfaz con i18next; español de España primero.
- Nombres de ejercicios por idioma y país en `exercise_translations` (por ejemplo, «press banca» en España y «press de pecho» en México).
- Peso en kg en la base de datos; el usuario elige kg o lb.
- Precios en céntimos con su moneda; EUR primero.

## 9. Analítica y errores

Eventos principales en PostHog: `signup`, `onboarding_completed`, `workout_started`, `workout_completed`, `routine_created`, `program_viewed`, `checkout_started`, `purchase_completed`, `enrollment_started`, `program_session_completed`, `program_completed`, `pro_started`, `share_tapped`.
Errores y rendimiento en Sentry (app y web), con especial atención a los fallos de sincronización.

## 10. Entornos y despliegue

| Entorno | Para qué |
| --- | --- |
| Local | Supabase CLI + Expo en el simulador o el móvil |
| Staging | Proyecto de Supabase aparte; builds internas (TestFlight y prueba interna de Google Play) |
| Producción | Proyecto de Supabase de producción; publicación en las tiendas con EAS Submit |

- Cambios en la base de datos **solo** mediante migraciones en `supabase/migrations`.
- Correcciones rápidas de la app con EAS Update; los cambios nativos requieren una build nueva.
- La web se despliega en Vercel automáticamente desde la rama principal.

## 11. Testing

- **Unitarios** (Vitest): lógica de progresión, 1RM, cálculo de PRs y repartos de comisión.
- **Base de datos:** tests de las políticas RLS (quién puede ver qué).
- **Edge Functions:** webhooks de Stripe y RevenueCat con eventos de prueba, incluidos duplicados y reembolsos.
- **End-to-end** (Maestro en el móvil): registrar un entreno y comprar y empezar un programa.

## 12. Decisiones técnicas abiertas

- [ ] Vendedor legal ante el comprador (plataforma o creador) → determina la configuración de Stripe Connect (tipo de cuenta y de cargo).
- [ ] Viabilidad y modelo de venta de programas dentro de la app (§6.3).
- [x] Sincronización: **cola propia sobre SQLite** (decidido el 03/11/2026).
  - **Por qué:** funciona en Expo Go, no tiene coste y no depende de otro servicio. PowerSync y WatermelonDB necesitan una development build, y PowerSync además es de pago.
  - **Cómo funciona:** el entreno en curso, la cola de subida y los últimos valores de cada ejercicio viven en un almacén Zustand que se escribe en SQLite tras cada cambio (`features/workouts/workout-store.ts`). Al terminar, el entreno pasa a la cola en una sola escritura y solo sale de ella cuando `save_workout()` confirma.
  - **Cuándo se sube:** al abrir la app, al volver a ella, al recuperar la conexión, al terminar un entreno y con «Reintentar subida».
  - **Cuentas:** todo va por usuario. Al cerrar sesión, los entrenos sin subir se quedan en el móvil y se suben cuando ese usuario vuelve a entrar. Al borrar la cuenta se eliminan del móvil.
- [x] Origen de la biblioteca de ejercicios inicial: **propia** (decidido el 03/11/2026). Los 148 ejercicios del paso 3, con sus nombres, otros nombres e instrucciones, se escribieron para Movyn. Se descartaron bases abiertas de origen poco claro y bases CC-BY-SA, que obligan a citar al autor en cada ejercicio y a compartir lo que se añada.
- [ ] Origen de las imágenes y los vídeos de los ejercicios: propios o con licencia, nunca copiados de otra app. Hay que decidirlo antes de la beta (paso 9); las opciones son grabarlos con los creadores piloto, encargarlos o comprar un paquete con licencia comercial.
