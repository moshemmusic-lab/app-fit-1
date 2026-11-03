# MVP.md — App Fit 1

> **Qué desarrollamos primero para lanzar la app al mercado.** Qué es imprescindible y qué puede esperar.
> Última actualización: 03/11/2026. Documentos relacionados: [PRODUCT.md](./PRODUCT.md) y [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 1. Objetivo del MVP

Demostrar dos cosas con el menor desarrollo posible:

1. **El tracker retiene:** la gente vuelve a registrar sus entrenos cada semana.
2. **El marketplace funciona:** los creadores venden y los compradores entrenan y terminan sus programas.

**Lanzamiento:** España, iOS y Android, en español (con la estructura de idiomas preparada para LatAm e inglés).

**Disciplina del MVP:** solo gimnasio (fuerza y cardio de gimnasio). El campo `discipline` existe desde el principio con el único valor `gym`, para añadir yoga, pilates u otras más adelante sin migraciones complicadas (ver ARCHITECTURE.md §5.7).

## 2. Regla para decidir qué entra

Una funcionalidad entra en el MVP solo si responde «sí» a una de estas preguntas:
- ¿Hace el registro de un entreno más rápido o más fiable?
- ¿Ayuda a vender un programa o a entrenarlo?
- ¿Hace que el usuario vuelva gracias a la comunidad?

Si no, va a V2 o V3.

## 3. Fases y puertas

| Fase | Contenido | Puerta para avanzar |
| --- | --- | --- |
| **0 · Validación** (nov–dic 2026) | Nombre y marca, entrevistas (10–15 creadores, 20–30 usuarios), fichar creadores, diseño de pantallas | 10 creadores fundadores firmados |
| **1 · MVP tracker** (ene–mar 2027) | Tracker, rutinas, progreso y social. Beta cerrada con 200–500 usuarios. Programas **gratuitos** de los creadores piloto | Retención a 30 días ≥ 35 % |
| **2 · MVP marketplace** (abr–may 2027) | Panel de creadores, pagos, venta web e in-app, Pro. **Lanzamiento en España** | Primeras 100 ventas |
| **3 · Crecimiento** (jun–dic 2027) | Funciones V2, Creador Pro, entrada en LatAm | — |

Las fechas suponen una dedicación semanal alta; se ajustan a las horas reales disponibles.

## 4. Imprescindible en el MVP

### 4.1 Cuenta y perfil (fase 1)
- [ ] Registro e inicio de sesión con email, Apple y Google. *Email y Apple, hechos (paso 2); Google, antes de la beta (paso 9).*
- [x] Onboarding: objetivo (fuerza, cardio o ambos), nivel, kg/lb y consentimiento de datos de salud.
- [x] Perfil con foto, nombre, bio y estadísticas básicas; perfil público o privado. *Las cifras reales llegan con los pasos 4 y 7.*
- [x] Ajustes: unidades, privacidad por defecto de los entrenos y notificaciones.
- [ ] Exportar mis datos y borrar mi cuenta. *Borrar cuenta, hecho (paso 2); exportar, tras el paso 6.*

### 4.2 Registro de entrenos (fase 1)
- [ ] Empezar un entreno vacío, desde una rutina o desde la sesión de hoy de un programa. *Vacío, hecho (paso 4); desde una rutina en el paso 5 y desde un programa en el paso 11.*
- [ ] Biblioteca de ejercicios en español con buscador, filtros por músculo y material, vídeo o imagen e instrucciones. *148 ejercicios propios con buscador, filtros e instrucciones, hechos (paso 3); faltan el vídeo o la imagen, que se deciden antes de la beta.*
- [x] Ejercicios de fuerza (peso × repeticiones, peso corporal) y de cardio (tiempo, distancia, calorías).
- [x] Valores de la última vez rellenados; marcar una serie en **2 toques**.
- [x] Temporizador de descanso automático y configurable.
- [x] Añadir, quitar, reordenar y sustituir ejercicios durante el entreno.
- [x] Notas por ejercicio y por entreno.
- [x] **Funciona sin conexión** y sincroniza al recuperarla.
- [ ] Resumen al terminar: duración, volumen, PRs conseguidos y botón de compartir. *Duración, volumen y series, hechos (paso 4); los PRs llegan en el paso 6 y el botón de compartir en el paso 8.*

### 4.3 Rutinas (fase 1)
- [ ] Crear, editar, duplicar y borrar rutinas; organizarlas en carpetas.
- [ ] Copiar rutinas de otros usuarios y guardarlas.
- [ ] Ejercicios personalizados.
- [ ] Límites del plan gratuito (iguales o algo más generosos que Hevy).

### 4.4 Progreso (fase 1)
- [ ] Historial de entrenos con calendario de constancia.
- [ ] PRs automáticos: 1RM estimado, peso máximo, repeticiones máximas y volumen.
- [ ] Gráfica de progreso por ejercicio.
- [ ] Volumen semanal.
- [ ] Peso corporal.

### 4.5 Social (fase 1)
- [ ] Seguir y dejar de seguir; solicitudes en perfiles privados.
- [ ] Feed de inicio con los entrenos de la gente que sigues.
- [ ] Me gusta y comentarios.
- [ ] Visibilidad por entreno: público, solo seguidores o privado.
- [ ] Compartir el resumen de un entreno o un PR como imagen para stories.
- [ ] Botón de denunciar contenido y usuarios.
- [ ] Buscar usuarios.

### 4.6 Programas: lado del usuario (fases 1 y 2)
- [ ] Catálogo con filtros: objetivo, nivel, días por semana, duración, material y precio.
- [ ] Ficha del programa: creador, descripción, requisitos y semana de muestra.
- [ ] «Mis programas»: los programas comprados (o gratuitos de los creadores piloto) aparecen automáticamente.
- [ ] Elegir fecha de inicio; ver las sesiones en el calendario.
- [ ] «Hoy toca»: la sesión del día con los pesos calculados.
- [ ] Progreso real frente al plan en cada semana.
- [ ] Feed y ranking semanal de la cohorte del programa.
- [ ] Un programa comprado se entrena completo **sin necesidad del Pro**.

### 4.7 Creadores: panel web (fase 2; versión mínima en la fase 1 para los programas piloto)
- [ ] Solicitud para ser creador; aprobación manual.
- [ ] Conectar la cuenta de cobro (Stripe Connect).
- [ ] Constructor de programas: semanas → sesiones → ejercicios → series, repeticiones, carga (kg, %1RM o RPE) y descanso; marcar la sesión de muestra.
- [ ] Ficha y precio; enviar a revisión.
- [ ] Versiones: editar un programa publicado sin afectar a quien ya lo compró.
- [ ] Landing pública del programa con enlace para compartir.
- [ ] Panel con ventas, ingresos, alumnos activos y porcentaje de finalización.

### 4.8 Pagos y monetización (fase 2)
- [ ] Venta web con Stripe Checkout (canal preferente) y reparto automático del 20 %.
- [ ] Compra dentro de la app (pendiente de validar el modelo con las normas de las tiendas).
- [ ] Pro con RevenueCat: 2,99 €/mes, 23,99 €/año y 74,99 € de por vida.
- [ ] Reembolsos (revocan el acceso al programa).
- [ ] Pagos periódicos a creadores.

### 4.9 Administración interna (fase 2)
- [ ] Aprobar creadores y revisar programas antes de publicarlos.
- [ ] Gestionar denuncias.
- [ ] Ver compras, reembolsos y pagos a creadores.

### 4.10 Legal y confianza (antes del lanzamiento)
- [ ] Condiciones de uso, política de privacidad y condiciones para creadores.
- [ ] Aviso en los programas: no sustituyen el consejo médico; sin resultados garantizados.
- [ ] Política de reembolsos y desistimiento.
- [ ] Decisión sobre quién es el vendedor legal y cómo se factura el IVA.

## 5. Para después

### V2 (tras el lanzamiento)
- Supersets, series de aproximación, RPE/RIR, calculadora de discos y de calentamiento. *(Calentamiento, drop set y fallo ya están desde el paso 4.)*
- Medidas y fotos de progreso.
- Series por grupo muscular, informe mensual e historial completo (Pro).
- **Retos sociales:** rankings por ejercicio y desafíos entre amigos.
- Reseñas verificadas y resultados agregados por programa.
- Autoprogresión dentro de los programas.
- Importar programas desde Excel; cupones y afiliados; analítica de adherencia para el creador.
- Creador Pro.

### V3
- Apple Watch y Wear OS; Apple Health y Health Connect.
- Progresión automática de pesos (equivalente a Hevy Trainer).
- Grupos, clubs y gimnasios; mensajería.
- Bundles y suscripción mensual a un creador.
- Versión web para usuarios.
- Nuevas disciplinas, si los datos lo justifican: primero yoga, pilates y movilidad; después calistenia y funcional. Running y ciclismo solo por importación desde Apple Health, Health Connect o Strava, sin GPS propio.

### Fuera de alcance (primeros 12 meses)
- Coach con IA, nutrición, deportes al aire libre con GPS y herramientas de entrenador uno a uno.

## 6. Criterios para dar el MVP por terminado

- [ ] Un usuario nuevo registra su primer entreno **sin ayuda**, y la mayoría lo hace en sus primeras 72 h.
- [ ] Registrar una serie cuesta 2 toques y funciona en modo avión.
- [ ] Un comprador llega desde Instagram, paga y tiene su programa en la app **en menos de 2 minutos**.
- [ ] Un comprador completa un programa entero dentro de la app.
- [ ] Un creador publica un programa **sin ayuda técnica**.
- [ ] Los pagos cuadran: compras, comisiones, reembolsos y pagos a creadores coinciden con Stripe y RevenueCat.
- [ ] Nadie puede ver datos o programas a los que no tiene acceso (tests de RLS en verde).

## 7. Orden de construcción con Claude Code

Cada paso es una funcionalidad completa de punta a punta (base de datos → lógica → pantalla) que se puede probar.

1. Repositorio (monorepo), `CLAUDE.md`, Supabase local y CI. *Hecho.*
2. Autenticación (email con código y Apple), onboarding, perfil, ajustes y borrar cuenta. *Hecho (probado en simulador y en iPhone el 03/11/2026).*
3. Biblioteca de ejercicios (modelo, traducciones, datos iniciales propios o con licencia). *Hecho (148 ejercicios propios).*
4. **Registrar un entreno** sin conexión + sincronización. *Hecho (probado en simulador el 03/11/2026).*
5. Rutinas y carpetas.
6. Historial, PRs y gráficas de progreso.
7. Seguir, feed, me gusta, comentarios, visibilidad y denuncias.
8. Compartir en stories.
9. **Beta cerrada** (TestFlight y prueba interna de Google Play) → medir activación y retención. Antes: inicio de sesión con Google (necesita development build) y «Exportar mis datos» (decidido el 02/11/2026: se hace cuando ya hay entrenos e historial que exportar, tras el paso 6).
10. Modelo de programas (versiones, sesiones, prescripciones, entitlements) + panel mínimo de creador.
11. Programas en la app: «Mis programas», fecha de inicio, «Hoy toca», progreso frente al plan → programas piloto gratuitos.
12. Feed y ranking de la cohorte.
13. Stripe Connect: alta de creadores, landing, checkout, webhook y reembolsos.
14. Pro con RevenueCat y límites del plan gratuito.
15. Compra dentro de la app (si se valida).
16. Administración: aprobación, revisión y moderación.
17. Legal, textos finales, fichas de las tiendas → **lanzamiento en España**.
