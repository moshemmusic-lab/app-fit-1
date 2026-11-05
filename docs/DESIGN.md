# Movyn

La app de gimnasio donde registras cada serie en dos toques y entrenas el programa de tu creador junto a todos los que lo siguen.

> «Movyn» es el nombre candidato, pendiente de verificar y registrar. Si cambia, cambian el nombre del sistema y el logotipo; los colores, la tipografía y los componentes se mantienen.

## Esencia

- **Rápida.** Se usa con una mano, sudando, entre series. Todo lo frecuente está a un toque y cada zona táctil mide al menos `touch-min` (44 px).
- **Deportiva y premium.** Superficies limpias, cifras grandes en tipografía condensada y un único acento lima.
- **Para cualquiera que entrena.** Mujeres y hombres, fuerza o cardio, principiante o avanzada. Nada de estética de culturismo agresivo.
- **El creador, visible.** Su nombre, su cara y su programa aparecen dentro de la experiencia, no escondidos.

## Voz

Directa, cercana y en segunda persona. Celebra el progreso sin exagerar.

| Sí | No |
| --- | --- |
| Hoy toca · Pierna y glúteo | ¡¡A destrozar la pierna hoy!! 💪 |
| Nuevo récord · Hip thrust 110 kg × 8 | ¡Eres una máquina imparable! |
| Se añade a tu calendario al instante. No necesitas Pro. | Desbloquea tu potencial con nuestra experiencia premium |
| Terminar | Finalizar sesión de entrenamiento |

- Botones con verbos de lo que ocurre: «Empezar entreno», «Comprar programa», «Añadir serie».
- Números con formato español: «6.240 kg», «24,99 €», «62,5».
- Sin emojis en la interfaz.

## Color

Dos temas con la misma identidad. **Oscuro** es el tema por defecto; **Claro** usa fondo gris y tarjetas blancas.

- **`lime`** es la marca. Se usa como **relleno**, nunca como texto sobre fondo claro: botón principal, serie hecha, día entrenado, chip activo y la barra de la pestaña activa. Encima siempre va `ink-on-lime`.
- **`accent-text`** es el acento cuando tiene que leerse como texto o icono: lima en oscuro y verde oscuro (`#3f5a00`) en claro, para cumplir contraste.
- **`slab`** es el bloque oscuro de marca y existe en los dos temas: portadas de programa, tarjeta «Hoy toca» y miniaturas. Lleva el número del programa en `lime` y el texto en `text-on-slab`. En el tema claro es lo que mantiene la fuerza deportiva.
- **Superficies:** `bg` (fondo) → `surface` (tarjetas) → `surface-2` (campos y botones secundarios).
- **Texto:** `text` para lo principal, `text-muted` para metadatos y `text-subtle` solo para pestañas inactivas sobre `surface`.
- **`warm`** solo marca las series de calentamiento.

Reglas:

1. Un único acento por pantalla: el lima. No se introducen otros colores de marca.
2. El estado no depende solo del color: la serie hecha cambia de relleno **y** muestra el check; la pestaña activa cambia de color, de peso **y** lleva barra.
3. Todo texto cumple 4,5:1 sobre su fondo en los dos temas.

## Tipografía

| Familia | Uso |
| --- | --- |
| **Barlow Condensed** (Google Fonts, 600–700) | Cifras y títulos: `display-xl`, `display-l`, `screen-title`, `metric` |
| **Inter** (Google Fonts, 400–700) | Todo lo demás: `heading`, `body-strong`, `body`, `caption`, `label` |

- Las cifras (kg, tiempo, precio, semanas) van siempre en Barlow Condensed. Es el rasgo más reconocible de la marca.
- `label` va en mayúsculas con espaciado de 0,06em, encima de una cifra o como cabecera de tabla.
- No se usan cursivas.

## Logotipo

Por ahora es solo tipográfico: **MOVYN** en Barlow Condensed 700, espaciado 0,04em, seguido de un punto en `lime` (en claro, `accent-text`). No hay símbolo gráfico todavía: se diseñará cuando el nombre esté registrado.

## Iconos

- Iconos de línea a `icon` (24 px), trazo 1,8, extremos y uniones redondeados, sin relleno.
- Color `text` o `text-subtle`; en acento, `accent-text`.
- Los botones de solo icono llevan siempre etiqueta accesible («Opciones del ejercicio», «Buscar»).
- Nunca emojis.

## Composición

- Pantalla de iPhone 390 × 844, margen lateral `space-4` (16 px).
- **Una sola forma para todos los marcos:** rectángulo con esquinas de `radius-md` (12 px), la de los botones. La usan botones, campos, chips, tarjetas, filas de opciones y hojas (decidido el 05/11/2026). Lo redondo (`radius-pill`) queda solo para lo que no es un marco: avatares, puntos del calendario, números de paso y barras de progreso.
- Tarjetas `surface`; las destacadas se distinguen por contenido y superficie, no por la forma.
- Sin sombras: la profundidad se marca con el cambio de superficie (`bg` → `surface` → `surface-2`).
- Las acciones principales van abajo, al alcance del pulgar: temporizador de descanso, «Comprar programa», barra de pestañas.
- Excepción: las pantallas que se abren para crear o elegir algo (crear rutina, añadir ejercicios) llevan «Cancelar» arriba a la izquierda y «Guardar» o «Crear» arriba a la derecha, como es habitual en iOS. Su acción grande del contenido («Añadir ejercicio», «Añadir 3 ejercicios») sigue abajo.
- Navegación en cinco pestañas: Inicio, Entrenar, Programas, Progreso y Perfil.

## Componentes

| Componente | Para qué |
| --- | --- |
| Button | Acción principal (lima), acción sobre slab, secundaria y fantasma |
| Chip | Filtros del catálogo de programas |
| StatTile | Cifras de resumen: duración, volumen, series, racha |
| SetRow | Fila de serie en la pantalla de entreno: la pieza más usada de la app |

## Lo que no hacemos

- Degradados, sombras de colores o fondos con texturas.
- Más de un acento por pantalla.
- Texto lima sobre fondo claro.
- Fotos de cuerpos como reclamo principal: el protagonista es el progreso y el programa.
