# ARCHITECTURE.md — App Fit 1

> **Cómo está construida la aplicación por dentro.** Tecnologías, base de datos, usuarios, pagos y cómo se conectan las piezas.
> Última actualización: 02/11/2026. Documentos relacionados: [PRODUCT.md](./PRODUCT.md) y [MVP.md](./MVP.md).

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
    ├── migrations/           # SQL versionado (única forma de cambiar la BD)
    ├── functions/            # Edge Functions: stripe-webhook, revenuecat-webhook, export-data, delete-account…
    ├── tests/database/       # Tests pgTAP (RLS activada en todas las tablas, políticas)
    └── seed.sql              # Biblioteca de ejercicios inicial
```

## 4. Usuarios, cuentas y permisos

**Inicio de sesión:** email (contraseña o enlace mágico), Apple y Google con Supabase Auth. Apple exige ofrecer un inicio de sesión equivalente centrado en la privacidad si hay otros inicios sociales, y Sign in with Apple lo cumple.

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
| `profiles` | Perfil público de cada usuario (1:1 con `auth.users`) | username, display_name, avatar_url, bio, units (kg/lb), locale, country, is_private, role, health_data_consent_at |
| `follows` | Quién sigue a quién | follower_id, following_id, status (pending/accepted para perfiles privados) |
| `likes`, `comments` | Interacción con entrenos compartidos | user_id, workout_id, body |
| `reports` | Denuncias de contenido | reporter_id, target_type, target_id, reason, status |

### 5.2 Ejercicios
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `exercises` | Biblioteca global y ejercicios personalizados | tracking_type (weight_reps, bodyweight_reps, duration, distance_duration, calories_duration), **disciplines[]**, primary_muscle, secondary_muscles[], equipment, video_url, owner_id (null = global) |
| `exercise_translations` | Nombre e instrucciones por idioma y país | exercise_id, locale («es-ES», «es-MX»), name, instructions, aliases[] |

El `tracking_type` decide qué campos de la serie se usan. Así el mismo modelo sirve para fuerza, cardio y, en el futuro, otros deportes.

### 5.3 Rutinas
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `routine_folders` | Carpetas | owner_id, name, position |
| `routines` | Plantilla de entreno propia o copiada | owner_id, folder_id, name, **discipline**, notes, visibility, copied_from_routine_id |
| `routine_exercises` | Ejercicios de la rutina | routine_id, exercise_id, position, superset_group, rest_seconds |
| `routine_sets` | Series objetivo | routine_exercise_id, position, set_type, target_reps, target_weight_kg, target_duration_s |

### 5.4 Entrenos (lo que el usuario hace)
| Tabla | Para qué | Campos clave |
| --- | --- | --- |
| `workouts` | Una sesión de entreno | id (generado en el móvil), user_id, **discipline**, **source** (app/imported), external_id, routine_id, enrollment_id, program_session_id, title, started_at, ended_at, notes, visibility |
| `workout_exercises` | Ejercicios hechos en la sesión | workout_id, exercise_id, position, superset_group, notes |
| `workout_sets` | Cada serie realizada | workout_exercise_id, position, set_type (warmup/normal/drop/failure), weight_kg, reps, duration_s, distance_m, calories, rpe, completed_at, **prescription_id** |
| `personal_records` | PRs calculados | user_id, exercise_id, record_type (est_1rm, max_weight, max_reps, max_volume), value, workout_set_id, achieved_at |
| `body_measurements` | Peso y medidas | user_id, measured_at, weight_kg, … |

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
5. En el servidor, un trigger calcula PRs y estadísticas, y el entreno aparece en el feed según su visibilidad.
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
- **Feed de inicio:** entrenos de la gente que sigues, según su visibilidad.
- **Feed de la cohorte:** entrenos vinculados a un `enrollment` del mismo programa.
- **Ranking semanal de la cohorte:** vista materializada que se recalcula periódicamente.

## 7. Seguridad, privacidad y RGPD

- Datos alojados en la **región UE** de Supabase.
- El historial de entrenos y las medidas pueden considerarse **datos de salud**: consentimiento explícito en el onboarding (`health_data_consent_at`).
- RLS en todas las tablas; nada sensible se lee sin pasar por ella.
- Claves y secretos en Supabase Secrets, EAS Secrets y Vercel, nunca en el repositorio.
- **Exportar datos** (Edge Function `export-data`, JSON y CSV) y **borrar cuenta** desde la app (`delete-account`): se borra el contenido del usuario y se anonimizan las compras que deban conservarse por contabilidad.
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
- [ ] Sincronización: cola propia sobre SQLite o una librería especializada (PowerSync, WatermelonDB).
- [ ] Origen de la biblioteca de ejercicios inicial y de sus vídeos: tiene que ser propia o con licencia, nunca copiada de otra app.
