# PRODUCT.md — App Fit 1

> **Qué estamos construyendo y por qué.** Fuente de verdad para las decisiones de negocio y producto.
> Nombre comercial provisional («App Fit 1»). Última actualización: 27/10/2026.
> Documentos relacionados: [ARCHITECTURE.md](./ARCHITECTURE.md) (cómo se construye) y [MVP.md](./MVP.md) (qué se construye primero).

---

## 1. Qué es

App Fit 1 es una app móvil para iOS y Android con la que cualquier persona registra sus entrenamientos de gimnasio, sigue su progreso y comparte con su comunidad. Además, tiene un **marketplace** donde creadores fitness venden sus programas de entrenamiento, que se integran directamente en la app para entrenarlos sesión a sesión.

**En una frase:** registra tus entrenos en segundos y entrena el programa de tu creador favorito junto a todos los que lo siguen.

**En la práctica:** todo lo que ofrece Hevy (registro, rutinas, historial, estadísticas y red social) más una capa de creadores que monetizan sus programas.

## 2. Por qué

| Quién | Problema actual | Qué le damos |
| --- | --- | --- |
| Usuario del gimnasio | Compra programas en PDF o Excel por Instagram, los sigue a mano, entrena solo y no sabe si progresa | El programa dentro de la app: sesión del día, pesos calculados, vídeos, progreso real frente al plan y comunidad de gente que hace lo mismo |
| Creador | Vende PDFs sin datos ni retención, no puede demostrar resultados y depende de plataformas genéricas | Su programa como experiencia interactiva, venta y cobro integrados, datos de adherencia y una comunidad que se queda en la app |

**Hueco de mercado:** Hevy domina el tracker social, pero no vende programas de creadores. Boostcamp ofrece miles de programas, pero gratis, así que el creador no gana dinero. Nadie combina un tracker simple, programas de pago y comunidad por programa, y menos para el público hispanohablante.

## 3. Usuarios

### Usuario (deportista)
- Cualquier persona que entrena en el gimnasio: **mujeres y hombres, de fuerza o de cardio**, principiante o avanzada.
- **No es una app para culturistas.** El tono, el diseño y el catálogo tienen que funcionar para quien busca tonificar, ganar fuerza, mejorar el cardio o simplemente ser constante.
- Necesita: registrar rápido, ver que progresa, tener un plan claro sin hojas de cálculo y motivación social.

### Creador
- Entrenadores y creadores fitness con comunidad en Instagram o TikTok (orientativo: 10.000–200.000 seguidores) que ya venden programas o quieren hacerlo.
- Solo entran **creadores aprobados manualmente**.
- Necesita: vender y cobrar sin montar su propia app, retener a sus compradores y demostrar resultados.

### Plataforma (nosotros)
- Ingresos recurrentes con la suscripción Pro y una comisión por cada venta.
- Los creadores aportan catálogo, contenido y, sobre todo, **distribución**: su audiencia es nuestro canal de captación.

## 4. Mercado

1. **España**, con creadores fundadores españoles y piloto físico en gimnasios de Málaga.
2. **LatAm** (México, Argentina, Colombia): mismo idioma, con creadores y métodos de pago locales.
3. **Mercados en inglés** y otros idiomas, con la misma fórmula.

La expansión se hace **creador a creador y país a país**. Desde el primer día, la app soporta varios idiomas, monedas, kg/lb y nombres de ejercicios por país.

## 5. Funcionalidades (visión completa)

El reparto por fases está en [MVP.md](./MVP.md).

- **Tracker de entrenos:** series, repeticiones, peso, tiempo y distancia; temporizador de descanso; rutinas y carpetas; supersets; tipos de serie (calentamiento, normal, aproximación, fallo); funcionamiento sin conexión.
- **Cardio en el gimnasio:** cinta, bici, elíptica, remo y escaladora, por tiempo, distancia y calorías.
- **Progreso:** historial, PRs automáticos, 1RM estimado, volumen, constancia, series por grupo muscular, medidas y fotos de progreso.
- **Social:** perfil, seguidores, feed de entrenos, me gusta y comentarios, copiar y compartir rutinas, compartir en stories, rankings y desafíos.
- **Programas y marketplace:** catálogo con filtros, ficha del programa, compra, programa integrado en el calendario, progreso frente al plan, comunidad (cohorte) y reseñas verificadas.
- **Herramientas del creador:** panel web, constructor de programas, landing de venta, cobros, analítica de ventas y adherencia, cupones y afiliados.

## 6. Cómo funciona el marketplace

**Lado creador**
1. Solicita entrar → lo aprobamos → conecta su cuenta de cobro.
2. Construye su programa en el panel web (semanas → días → ejercicios → series, repeticiones, carga y descanso).
3. Lo enviamos a revisión → se publica → recibe un enlace para compartir en su bio de Instagram.
4. Ve ventas, alumnos activos y porcentaje de finalización. Cobra periódicamente.

**Lado usuario**
1. Llega por el enlace del creador o desde el catálogo de la app.
2. Ve la ficha: quién lo crea, objetivo, nivel, días por semana, duración, material, semana de muestra y requisitos.
3. Compra (en la web o en la app) → el programa **aparece automáticamente en su biblioteca**.
4. Elige fecha de inicio → cada día la app le muestra la sesión que toca, con los pesos calculados.
5. Entrena, ve su progreso frente al plan y lo comparte con la cohorte del programa.

**Reglas del marketplace**
- **Lo comprado no exige Pro.** Un usuario gratuito entrena completo cualquier programa que haya comprado.
- **Versiones:** si el creador actualiza un programa, quien ya lo compró conserva su versión y su historial.
- **Reseñas verificadas:** solo puede reseñar quien ha entrenado el programa.
- **Calidad y seguridad:** revisión antes de publicar, sin promesas médicas ni resultados garantizados.

**Ejemplo:** un entrenador vende un programa de 30 €. La plataforma se queda el **20 %** de lo que queda tras la comisión de la tienda o de la pasarela de pago. El resto es para el creador.

| Canal | Tienda o pasarela | Plataforma (20 %) | Creador |
| --- | --- | --- | --- |
| Compra en la web (Stripe) | ≈ 0,70 € | ≈ 5,86 € | ≈ 23,44 € |
| Compra en la app (tienda al 15 %) | ≈ 4,50 € | ≈ 5,10 € | ≈ 20,40 € |

Cifras aproximadas, sin contar el IVA. Por eso la **venta web** desde la landing del creador es el canal preferente.

## 7. Modelo de negocio

| Fuente | Propuesta |
| --- | --- |
| **Gratis** | Tracker completo, feed social y compra de programas. Límites iguales o algo más generosos que Hevy (Hevy gratis: 4 rutinas, 7 ejercicios personalizados y 3 meses de gráficas) |
| **Pro** | **2,99 €/mes · 23,99 €/año · 74,99 € de por vida.** Los mismos importes que Hevy: no podemos empezar más caros que el líder |
| **Marketplace** | **20 % de comisión** por venta |
| **Creador Pro** (V2) | Suscripción opcional para creadores: analítica avanzada, cupones y comunidad privada |

**Qué incluye el Pro:** rutinas y ejercicios personalizados ilimitados, historial completo de gráficas, series por grupo muscular, calculadora de calentamiento y, más adelante, progresión automática de pesos.

**Creadores fundadores:** condiciones especiales de lanzamiento (a decidir: 0 % de comisión durante 6 meses o 10 % de por vida), alta hecha por nosotros y protagonismo en el lanzamiento.

**Escenario orientativo al final del primer año** (no es una previsión): 15.000 usuarios, 3 % en Pro y 600 programas al mes a 25 € → unos 1.350 €/mes de Pro + 3.000 €/mes de marketplace ≈ **4.350 €/mes**. El marketplace aporta casi el 70 %.

## 8. Diferenciación frente a Hevy

| Aspecto | Hevy | App Fit 1 |
| --- | --- | --- |
| Tracker y social | Excelente | Al mismo nivel en lo básico (objetivo no negociable) |
| Precio del Pro | 2,99 / 23,99 / 74,99 | Igual |
| Programas de creadores | No los vende | Marketplace con un 20 % de comisión |
| Comunidad por programa | No | Feed, ranking y progreso de la cohorte de cada programa |
| Mercado | Global, comunidad y contenido en inglés | Creadores y comunidad hispanos desde el primer día |
| Resultados | Del usuario | Del usuario y agregados por programa («media de +8 kg en sentadilla en 12 semanas») |
| Captación | Tiendas de apps y boca a boca | Audiencias de los creadores |

**El foso no son las funcionalidades,** que se pueden copiar, sino la red de creadores hispanos y los datos de resultados que se acumulan con cada programa.

## 9. Otros deportes más adelante

El MVP es **solo gimnasio** (fuerza y cardio de gimnasio). La base de datos está preparada para añadir disciplinas sin rehacer nada. El orden previsto, si los datos lo justifican:

1. **Yoga, pilates y movilidad:** coste bajo, mismo modelo de sesiones por tiempo, muchas creadoras que venden programas y refuerzo del público femenino.
2. **Calistenia, funcional y HIIT:** coste bajo, misma lógica de repeticiones, tiempo y circuitos.
3. **Running y ciclismo:** **no se construye GPS propio**. Las actividades se importan desde Apple Health, Health Connect o Strava para completar el historial y el perfil. Construir GPS sería otro producto y competir con Strava.

## 10. Qué no somos (primeros 12 meses)

- Ni coach con IA ni app de nutrición.
- Ni app de deportes al aire libre con GPS (running, ciclismo).
- Ni software de entrenador personal uno a uno (tipo Hevy Coach o Trainerize).
- Sin mensajes privados entre usuarios en el MVP.

## 11. Principios de producto

1. **Dos toques por serie.** Los valores de la última sesión aparecen rellenados; marcar la serie lanza el descanso.
2. **Útil sin comprar nada.** El tracker gratuito tiene que valer por sí mismo.
3. **Lo pagado nunca se bloquea.**
4. **Funciona sin conexión.** El gimnasio en un sótano no puede romper el registro.
5. **Privacidad clara.** El usuario decide qué comparte y con quién.
6. **El creador visible.** Su cara y su marca están dentro de su programa.
7. **Celebrar el progreso.** PRs, rachas y semanas completadas, fáciles de compartir.

## 12. Métricas que importan

| Métrica | Objetivo inicial (hipótesis) |
| --- | --- |
| Usuarios nuevos que completan su primer entreno en 24–72 h | ≥ 50 % en la primera semana |
| Usuarios activos semanales con ≥ 2 entrenos | 40 % de los registrados |
| Retención a 30 días | ≥ 35 % |
| Programas terminados sobre comprados | A medir en la beta |
| Conversión visita → compra en la landing | ≥ 3 % |
| Ingresos mensuales por creador fundador activo | ≥ 300 € |
| Conversión a Pro | 3–5 % |

## 13. Decisiones abiertas

- [ ] Nombre comercial y marca (candidatos: Movyn, Ferru).
- [ ] Límites exactos del plan gratuito.
- [ ] Precio mínimo y máximo de los programas; descuentos y cupones.
- [ ] Condiciones para los creadores fundadores.
- [ ] Quién es el vendedor legal ante el comprador (plataforma o creador) y cómo se factura el IVA.
- [ ] Política de selección de creadores y de propiedad de los programas.
- [ ] Dedicación semanal real al desarrollo, para fijar los plazos.
