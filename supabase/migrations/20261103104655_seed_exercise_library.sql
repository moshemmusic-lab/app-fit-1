-- Initial exercise library (MVP step 3): common gym strength and cardio exercises.
--
-- Our own content: names, aliases and instructions were written for Movyn (Spanish, Spain).
-- It is not copied from any app or dataset (docs/ARCHITECTURE.md §12). Images and videos
-- come later, in a new migration.
--
-- To add or fix exercises, write a new migration that refers to them by slug.

with library (
  slug, tracking_type, primary_muscle, secondary_muscles, equipment, name, aliases, instructions
) as (
  values
    -- Chest ------------------------------------------------------------------
    (
      'barbell-bench-press', 'weight_reps', 'chest', '{triceps,shoulders}', 'barbell',
      'Press de banca con barra',
      array['press banca', 'press plano', 'bench press'],
      array[
        'Túmbate en el banco con los ojos bajo la barra y los pies firmes en el suelo.',
        'Agarra la barra algo más abierto que los hombros y junta las escápulas.',
        'Baja la barra controlada hasta rozar la parte baja del pecho.',
        'Empuja hasta estirar los brazos sin despegar la espalda del banco.'
      ]
    ),
    (
      'incline-barbell-bench-press', 'weight_reps', 'chest', '{shoulders,triceps}', 'barbell',
      'Press inclinado con barra',
      array['press banca inclinado', 'incline bench press'],
      array[
        'Ajusta el respaldo a unos 30 grados y túmbate con los pies apoyados.',
        'Agarra la barra algo más abierto que los hombros y sácala de los soportes.',
        'Baja la barra hasta la parte alta del pecho con los codos algo cerrados.',
        'Empuja hacia arriba hasta estirar los brazos.'
      ]
    ),
    (
      'decline-barbell-bench-press', 'weight_reps', 'chest', '{triceps,shoulders}', 'barbell',
      'Press declinado con barra',
      array['press banca declinado', 'decline bench press'],
      array[
        'Túmbate en el banco declinado con las piernas sujetas en los rodillos.',
        'Agarra la barra algo más abierto que los hombros.',
        'Baja la barra hasta la parte baja del pecho.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'dumbbell-bench-press', 'weight_reps', 'chest', '{triceps,shoulders}', 'dumbbell',
      'Press de banca con mancuernas',
      array['press plano con mancuernas', 'dumbbell bench press'],
      array[
        'Túmbate en el banco con una mancuerna en cada mano a la altura del pecho.',
        'Empuja las mancuernas hacia arriba hasta estirar los brazos.',
        'Baja despacio hasta que los codos queden algo por debajo del banco.'
      ]
    ),
    (
      'incline-dumbbell-bench-press', 'weight_reps', 'chest', '{shoulders,triceps}', 'dumbbell',
      'Press inclinado con mancuernas',
      array['incline dumbbell press'],
      array[
        'Ajusta el respaldo a unos 30 grados y siéntate con las mancuernas sobre los muslos.',
        'Túmbate y lleva las mancuernas a los lados del pecho.',
        'Empuja hacia arriba y ligeramente hacia dentro hasta estirar los brazos.',
        'Baja despacio hasta notar el estiramiento en el pecho.'
      ]
    ),
    (
      'decline-dumbbell-bench-press', 'weight_reps', 'chest', '{triceps,shoulders}', 'dumbbell',
      'Press declinado con mancuernas',
      array['decline dumbbell press'],
      array[
        'Túmbate en el banco declinado con las piernas sujetas y una mancuerna en cada mano.',
        'Empuja las mancuernas hacia arriba hasta estirar los brazos.',
        'Baja controlado hasta los lados de la parte baja del pecho.'
      ]
    ),
    (
      'dumbbell-fly', 'weight_reps', 'chest', '{shoulders}', 'dumbbell',
      'Aperturas con mancuernas',
      array['aperturas planas', 'flyes', 'dumbbell fly'],
      array[
        'Túmbate en el banco con las mancuernas sobre el pecho y las palmas enfrentadas.',
        'Con los codos un poco flexionados, abre los brazos en arco hasta notar el estiramiento.',
        'Cierra el arco hasta juntar las mancuernas sobre el pecho.'
      ]
    ),
    (
      'incline-dumbbell-fly', 'weight_reps', 'chest', '{shoulders}', 'dumbbell',
      'Aperturas inclinadas con mancuernas',
      array['incline fly'],
      array[
        'Ajusta el respaldo a unos 30 grados y túmbate con las mancuernas sobre el pecho.',
        'Con los codos un poco flexionados, abre los brazos en arco.',
        'Vuelve a juntar las mancuernas apretando el pecho.'
      ]
    ),
    (
      'cable-crossover', 'weight_reps', 'chest', '{shoulders}', 'cable',
      'Cruce de poleas',
      array['crossover', 'cruces en polea alta', 'cable fly'],
      array[
        'Coloca las poleas altas, agarra un estribo con cada mano y da un paso al frente.',
        'Inclina un poco el tronco y mantén los codos ligeramente flexionados.',
        'Junta las manos delante de la cadera dibujando un arco.',
        'Vuelve despacio hasta notar el estiramiento en el pecho.'
      ]
    ),
    (
      'low-cable-fly', 'weight_reps', 'chest', '{shoulders}', 'cable',
      'Aperturas desde polea baja',
      array['cruce de poleas bajo', 'low to high cable fly'],
      array[
        'Coloca las poleas en la posición más baja y agarra un estribo con cada mano.',
        'Con los codos ligeramente flexionados, sube las manos en arco hasta la altura del pecho.',
        'Baja despacio hasta la posición inicial.'
      ]
    ),
    (
      'machine-chest-press', 'weight_reps', 'chest', '{triceps,shoulders}', 'machine',
      'Press de pecho en máquina',
      array['chest press', 'press sentado en máquina'],
      array[
        'Ajusta el asiento para que las asas queden a la altura del pecho.',
        'Apoya la espalda en el respaldo y agarra las asas.',
        'Empuja hasta estirar los brazos sin bloquear los codos.',
        'Vuelve despacio hasta notar el estiramiento.'
      ]
    ),
    (
      'incline-machine-chest-press', 'weight_reps', 'chest', '{shoulders,triceps}', 'machine',
      'Press inclinado en máquina',
      array['incline chest press'],
      array[
        'Ajusta el asiento para que las asas queden a la altura de la parte alta del pecho.',
        'Empuja hacia arriba y al frente hasta estirar los brazos.',
        'Vuelve despacio sin dejar que el peso toque abajo.'
      ]
    ),
    (
      'pec-deck', 'weight_reps', 'chest', '{shoulders}', 'machine',
      'Aperturas en máquina',
      array['pec deck', 'contractora', 'mariposa'],
      array[
        'Ajusta el asiento para que las asas queden a la altura del pecho.',
        'Con los codos ligeramente flexionados, junta las asas delante de ti.',
        'Abre despacio hasta notar el estiramiento en el pecho.'
      ]
    ),
    (
      'smith-machine-bench-press', 'weight_reps', 'chest', '{triceps,shoulders}', 'smith_machine',
      'Press de banca en multipower',
      array['press en máquina smith', 'smith bench press'],
      array[
        'Coloca el banco para que la barra baje a la parte baja del pecho.',
        'Agarra la barra algo más abierto que los hombros y gírala para soltar los seguros.',
        'Baja la barra controlada hasta rozar el pecho.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'push-up', 'bodyweight_reps', 'chest', '{triceps,shoulders,abs}', 'bodyweight',
      'Flexiones',
      array['flexiones de brazos', 'lagartijas', 'push up'],
      array[
        'Apoya las manos algo más abiertas que los hombros y estira el cuerpo en línea recta.',
        'Baja el pecho hacia el suelo con los codos a unos 45 grados del cuerpo.',
        'Empuja el suelo hasta estirar los brazos sin hundir la cadera.'
      ]
    ),
    (
      'incline-push-up', 'bodyweight_reps', 'chest', '{triceps,shoulders}', 'bodyweight',
      'Flexiones con manos elevadas',
      array['flexiones inclinadas', 'incline push up'],
      array[
        'Apoya las manos en un banco o un cajón y estira el cuerpo en línea recta.',
        'Baja el pecho hacia el banco doblando los codos.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'decline-push-up', 'bodyweight_reps', 'chest', '{shoulders,triceps}', 'bodyweight',
      'Flexiones con pies elevados',
      array['flexiones declinadas', 'decline push up'],
      array[
        'Apoya los pies en un banco y las manos en el suelo, algo más abiertas que los hombros.',
        'Baja el pecho hacia el suelo manteniendo el cuerpo recto.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'chest-dip', 'bodyweight_reps', 'chest', '{triceps,shoulders}', 'bodyweight',
      'Fondos en paralelas para pecho',
      array['fondos', 'dips', 'chest dips'],
      array[
        'Sujétate en las paralelas con los brazos estirados.',
        'Inclina el tronco hacia delante y baja doblando los codos.',
        'Baja hasta notar el estiramiento en el pecho y empuja hasta estirar los brazos.'
      ]
    ),
    (
      'dumbbell-pullover', 'weight_reps', 'chest', '{lats,triceps}', 'dumbbell',
      'Pullover con mancuerna',
      array['pull over'],
      array[
        'Túmbate en el banco y sujeta una mancuerna con las dos manos sobre el pecho.',
        'Con los codos un poco flexionados, lleva la mancuerna hacia atrás por encima de la cabeza.',
        'Vuelve a subirla sobre el pecho en el mismo arco.'
      ]
    ),

    -- Back -------------------------------------------------------------------
    (
      'deadlift', 'weight_reps', 'lower_back', '{glutes,hamstrings,traps,forearms,quadriceps}', 'barbell',
      'Peso muerto',
      array['peso muerto convencional', 'deadlift'],
      array[
        'Colócate con los pies a la anchura de la cadera y la barra sobre la mitad del pie.',
        'Agarra la barra justo por fuera de las piernas con la espalda recta.',
        'Empuja el suelo con las piernas y sube la barra pegada al cuerpo hasta estar de pie.',
        'Baja la barra llevando la cadera atrás y manteniendo la espalda recta.'
      ]
    ),
    (
      'sumo-deadlift', 'weight_reps', 'glutes', '{hamstrings,adductors,lower_back,quadriceps}', 'barbell',
      'Peso muerto sumo',
      array['sumo deadlift'],
      array[
        'Abre los pies bastante más que los hombros con las puntas hacia fuera.',
        'Agarra la barra por dentro de las piernas con los brazos estirados.',
        'Empuja el suelo hacia los lados y sube hasta estar de pie.',
        'Baja controlado con la espalda recta.'
      ]
    ),
    (
      'rack-pull', 'weight_reps', 'lower_back', '{glutes,traps,hamstrings,forearms}', 'barbell',
      'Peso muerto desde soportes',
      array['peso muerto parcial', 'rack pull'],
      array[
        'Coloca la barra en los soportes a la altura de las rodillas.',
        'Agárrala con la espalda recta y los hombros por encima de la barra.',
        'Extiende la cadera hasta estar de pie y baja controlado a los soportes.'
      ]
    ),
    (
      'barbell-row', 'weight_reps', 'upper_back', '{lats,biceps,lower_back}', 'barbell',
      'Remo con barra',
      array['remo inclinado con barra', 'bent over row'],
      array[
        'De pie, inclina el tronco hacia delante con la espalda recta y las rodillas algo flexionadas.',
        'Agarra la barra con las manos a la anchura de los hombros.',
        'Lleva la barra hacia el ombligo juntando las escápulas.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'pendlay-row', 'weight_reps', 'upper_back', '{lats,biceps,lower_back}', 'barbell',
      'Remo Pendlay',
      array['pendlay row'],
      array[
        'Inclina el tronco hasta que quede casi paralelo al suelo con la barra apoyada en el suelo.',
        'Tira de la barra con fuerza hasta el pecho sin levantar el tronco.',
        'Devuelve la barra al suelo en cada repetición.'
      ]
    ),
    (
      't-bar-row', 'weight_reps', 'upper_back', '{lats,biceps}', 'barbell',
      'Remo en T',
      array['remo con barra en T', 't bar row'],
      array[
        'Colócate sobre la barra con las piernas a los lados y agarra el asa.',
        'Inclina el tronco con la espalda recta y las rodillas algo flexionadas.',
        'Tira del asa hacia el pecho juntando las escápulas.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'dumbbell-row', 'weight_reps', 'lats', '{upper_back,biceps}', 'dumbbell',
      'Remo con mancuerna a una mano',
      array['remo unilateral', 'one arm dumbbell row'],
      array[
        'Apoya una mano y una rodilla en el banco con la espalda recta.',
        'Con la otra mano, tira de la mancuerna hacia la cadera llevando el codo atrás.',
        'Baja despacio hasta estirar el brazo. Cambia de lado al terminar.'
      ]
    ),
    (
      'chest-supported-dumbbell-row', 'weight_reps', 'upper_back', '{lats,biceps,shoulders}', 'dumbbell',
      'Remo con mancuernas apoyado en banco inclinado',
      array['remo en banco inclinado', 'chest supported row'],
      array[
        'Túmbate boca abajo en un banco inclinado con una mancuerna en cada mano.',
        'Tira de las mancuernas hacia los lados del pecho juntando las escápulas.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'seated-cable-row', 'weight_reps', 'upper_back', '{lats,biceps}', 'cable',
      'Remo sentado en polea',
      array['remo en polea baja', 'remo gironda', 'seated row'],
      array[
        'Siéntate con los pies en los apoyos y las rodillas algo flexionadas.',
        'Agarra el asa con el tronco recto.',
        'Tira del asa hacia el abdomen juntando las escápulas.',
        'Vuelve despacio hasta estirar los brazos sin encorvar la espalda.'
      ]
    ),
    (
      'single-arm-cable-row', 'weight_reps', 'lats', '{upper_back,biceps}', 'cable',
      'Remo a una mano en polea',
      array['remo unilateral en polea'],
      array[
        'Coloca la polea a la altura del pecho y agarra el estribo con una mano.',
        'Tira hacia la cadera llevando el codo pegado al cuerpo.',
        'Vuelve despacio estirando el brazo. Cambia de lado al terminar.'
      ]
    ),
    (
      'machine-row', 'weight_reps', 'upper_back', '{lats,biceps}', 'machine',
      'Remo en máquina',
      array['remo sentado en máquina', 'machine row'],
      array[
        'Ajusta el asiento y apoya el pecho en el respaldo.',
        'Agarra las asas y tira hacia ti juntando las escápulas.',
        'Vuelve despacio hasta estirar los brazos.'
      ]
    ),
    (
      'lat-pulldown', 'weight_reps', 'lats', '{biceps,upper_back}', 'cable',
      'Jalón al pecho',
      array['polea al pecho', 'jalón', 'lat pulldown'],
      array[
        'Siéntate con los muslos bajo los rodillos y agarra la barra algo más abierto que los hombros.',
        'Inclina un poco el tronco hacia atrás.',
        'Tira de la barra hasta la parte alta del pecho llevando los codos hacia abajo.',
        'Sube despacio hasta estirar los brazos.'
      ]
    ),
    (
      'close-grip-lat-pulldown', 'weight_reps', 'lats', '{biceps,upper_back}', 'cable',
      'Jalón al pecho con agarre estrecho',
      array['jalón agarre neutro', 'close grip pulldown'],
      array[
        'Coloca el agarre estrecho y siéntate con los muslos bajo los rodillos.',
        'Tira del agarre hasta el pecho con los codos pegados al cuerpo.',
        'Sube despacio hasta estirar los brazos.'
      ]
    ),
    (
      'machine-lat-pulldown', 'weight_reps', 'lats', '{biceps,upper_back}', 'machine',
      'Jalón en máquina',
      array['machine pulldown'],
      array[
        'Ajusta el asiento para que las asas queden al alcance con los brazos estirados.',
        'Tira de las asas hacia abajo hasta la altura del pecho.',
        'Sube despacio sin soltar la tensión.'
      ]
    ),
    (
      'straight-arm-pulldown', 'weight_reps', 'lats', '{triceps,upper_back}', 'cable',
      'Pullover en polea alta',
      array['jalón con brazos rectos', 'straight arm pulldown'],
      array[
        'De pie frente a la polea alta, agarra la barra con los brazos casi estirados.',
        'Inclina un poco el tronco y baja la barra en arco hasta los muslos.',
        'Sube despacio hasta la altura de los ojos.'
      ]
    ),
    (
      'pull-up', 'bodyweight_reps', 'lats', '{biceps,upper_back,forearms}', 'bodyweight',
      'Dominadas',
      array['dominadas pronas', 'pull up'],
      array[
        'Cuélgate de la barra con las palmas hacia delante, algo más abierto que los hombros.',
        'Tira de ti hasta que la barbilla pase la barra.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'chin-up', 'bodyweight_reps', 'lats', '{biceps,upper_back}', 'bodyweight',
      'Dominadas supinas',
      array['dominadas con agarre supino', 'chin up'],
      array[
        'Cuélgate de la barra con las palmas hacia ti, a la anchura de los hombros.',
        'Tira de ti hasta que la barbilla pase la barra.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'inverted-row', 'bodyweight_reps', 'upper_back', '{lats,biceps}', 'bodyweight',
      'Remo invertido',
      array['remo australiano', 'australian pull up'],
      array[
        'Colócate bajo una barra a la altura de la cadera y agárrala con los brazos estirados.',
        'Con el cuerpo recto y los talones en el suelo, tira del pecho hacia la barra.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'back-extension', 'bodyweight_reps', 'lower_back', '{glutes,hamstrings}', 'bodyweight',
      'Extensiones lumbares',
      array['hiperextensiones', 'back extension'],
      array[
        'Colócate en el banco de extensiones con la cadera apoyada y los pies sujetos.',
        'Baja el tronco con la espalda recta.',
        'Sube hasta que el cuerpo quede en línea recta, sin pasarte.'
      ]
    ),
    (
      'good-morning', 'weight_reps', 'hamstrings', '{lower_back,glutes}', 'barbell',
      'Buenos días con barra',
      array['good morning'],
      array[
        'Coloca la barra sobre la parte alta de la espalda, como en la sentadilla.',
        'Con las rodillas algo flexionadas, inclina el tronco llevando la cadera atrás.',
        'Baja hasta notar el estiramiento detrás de las piernas y vuelve a subir.'
      ]
    ),
    (
      'barbell-shrug', 'weight_reps', 'traps', '{forearms}', 'barbell',
      'Encogimientos con barra',
      array['encogimiento de hombros', 'shrugs'],
      array[
        'De pie, sujeta la barra delante de los muslos con los brazos estirados.',
        'Sube los hombros hacia las orejas sin doblar los codos.',
        'Baja despacio.'
      ]
    ),
    (
      'dumbbell-shrug', 'weight_reps', 'traps', '{forearms}', 'dumbbell',
      'Encogimientos con mancuernas',
      array['dumbbell shrugs'],
      array[
        'De pie, sujeta una mancuerna en cada mano a los lados del cuerpo.',
        'Sube los hombros hacia las orejas sin doblar los codos.',
        'Baja despacio.'
      ]
    ),

    -- Shoulders --------------------------------------------------------------
    (
      'overhead-press', 'weight_reps', 'shoulders', '{triceps,upper_back,abs}', 'barbell',
      'Press militar con barra',
      array['press militar', 'overhead press', 'ohp'],
      array[
        'De pie, sujeta la barra a la altura de las clavículas con las manos algo más abiertas que los hombros.',
        'Aprieta el abdomen y los glúteos.',
        'Empuja la barra por encima de la cabeza hasta estirar los brazos.',
        'Baja controlado hasta las clavículas.'
      ]
    ),
    (
      'seated-dumbbell-shoulder-press', 'weight_reps', 'shoulders', '{triceps}', 'dumbbell',
      'Press de hombros con mancuernas sentado',
      array['press militar con mancuernas', 'dumbbell shoulder press'],
      array[
        'Siéntate con el respaldo vertical y las mancuernas a la altura de los hombros.',
        'Empuja hacia arriba hasta casi juntar las mancuernas sobre la cabeza.',
        'Baja despacio hasta la altura de las orejas.'
      ]
    ),
    (
      'arnold-press', 'weight_reps', 'shoulders', '{triceps}', 'dumbbell',
      'Press Arnold',
      array['arnold press'],
      array[
        'Siéntate con las mancuernas delante de los hombros y las palmas hacia ti.',
        'Empuja hacia arriba girando las muñecas hasta que las palmas miren al frente.',
        'Baja deshaciendo el giro hasta la posición inicial.'
      ]
    ),
    (
      'machine-shoulder-press', 'weight_reps', 'shoulders', '{triceps}', 'machine',
      'Press de hombros en máquina',
      array['shoulder press machine'],
      array[
        'Ajusta el asiento para que las asas queden a la altura de los hombros.',
        'Empuja hacia arriba hasta estirar los brazos.',
        'Baja despacio sin dejar que el peso toque abajo.'
      ]
    ),
    (
      'smith-machine-shoulder-press', 'weight_reps', 'shoulders', '{triceps}', 'smith_machine',
      'Press de hombros en multipower',
      array['press militar en multipower', 'smith shoulder press'],
      array[
        'Coloca un banco vertical bajo la barra del multipower.',
        'Agarra la barra algo más abierto que los hombros y suelta los seguros.',
        'Baja la barra hasta la barbilla y empuja hasta estirar los brazos.'
      ]
    ),
    (
      'landmine-press', 'weight_reps', 'shoulders', '{chest,triceps}', 'barbell',
      'Press landmine',
      array['press con mina', 'landmine press'],
      array[
        'Fija un extremo de la barra en el suelo o en un soporte y sujeta el otro a la altura del hombro.',
        'Empuja la barra hacia arriba y al frente hasta estirar el brazo.',
        'Baja controlado. Cambia de lado al terminar.'
      ]
    ),
    (
      'push-press', 'weight_reps', 'shoulders', '{triceps,quadriceps,glutes}', 'barbell',
      'Push press',
      array['press con impulso'],
      array[
        'De pie, sujeta la barra a la altura de las clavículas.',
        'Flexiona un poco las rodillas y extiéndelas con fuerza.',
        'Aprovecha el impulso para empujar la barra por encima de la cabeza.',
        'Baja la barra a las clavículas amortiguando con las piernas.'
      ]
    ),
    (
      'dumbbell-lateral-raise', 'weight_reps', 'shoulders', '{traps}', 'dumbbell',
      'Elevaciones laterales con mancuernas',
      array['laterales', 'vuelos laterales', 'lateral raise'],
      array[
        'De pie, sujeta una mancuerna en cada mano a los lados del cuerpo.',
        'Con los codos algo flexionados, sube los brazos hacia los lados hasta la altura de los hombros.',
        'Baja despacio.'
      ]
    ),
    (
      'cable-lateral-raise', 'weight_reps', 'shoulders', '{traps}', 'cable',
      'Elevación lateral en polea',
      array['cable lateral raise'],
      array[
        'Colócate de lado junto a la polea baja y agarra el estribo con la mano más alejada.',
        'Sube el brazo hacia el lado hasta la altura del hombro.',
        'Baja despacio. Cambia de lado al terminar.'
      ]
    ),
    (
      'machine-lateral-raise', 'weight_reps', 'shoulders', '{traps}', 'machine',
      'Elevaciones laterales en máquina',
      array['machine lateral raise'],
      array[
        'Ajusta el asiento para que los hombros queden alineados con el eje de la máquina.',
        'Apoya los brazos en los rodillos y súbelos hacia los lados hasta la altura de los hombros.',
        'Baja despacio.'
      ]
    ),
    (
      'dumbbell-front-raise', 'weight_reps', 'shoulders', '{chest}', 'dumbbell',
      'Elevaciones frontales con mancuernas',
      array['frontales', 'front raise'],
      array[
        'De pie, sujeta las mancuernas delante de los muslos.',
        'Sube los brazos al frente hasta la altura de los hombros.',
        'Baja despacio.'
      ]
    ),
    (
      'rear-delt-fly', 'weight_reps', 'shoulders', '{upper_back,traps}', 'dumbbell',
      'Pájaros con mancuernas',
      array['aperturas posteriores', 'vuelos posteriores', 'rear delt fly'],
      array[
        'Inclina el tronco hacia delante con la espalda recta y las mancuernas colgando.',
        'Con los codos algo flexionados, abre los brazos hacia los lados.',
        'Baja despacio.'
      ]
    ),
    (
      'reverse-pec-deck', 'weight_reps', 'shoulders', '{upper_back,traps}', 'machine',
      'Aperturas posteriores en máquina',
      array['pájaros en máquina', 'reverse pec deck'],
      array[
        'Siéntate mirando al respaldo con las asas a la altura de los hombros.',
        'Lleva los brazos hacia atrás abriéndolos en arco.',
        'Vuelve despacio al frente.'
      ]
    ),
    (
      'face-pull', 'weight_reps', 'shoulders', '{upper_back,traps}', 'cable',
      'Face pull',
      array['tirón a la cara', 'face pull en polea'],
      array[
        'Coloca la cuerda en la polea a la altura de la cara y agárrala con las palmas hacia abajo.',
        'Tira de la cuerda hacia la frente separando las manos y llevando los codos altos.',
        'Vuelve despacio hasta estirar los brazos.'
      ]
    ),
    (
      'upright-row', 'weight_reps', 'shoulders', '{traps,biceps}', 'barbell',
      'Remo al mentón con barra',
      array['remo vertical', 'upright row'],
      array[
        'De pie, sujeta la barra delante de los muslos con las manos a la anchura de los hombros.',
        'Sube la barra pegada al cuerpo hasta el pecho llevando los codos hacia arriba.',
        'Baja despacio.'
      ]
    ),
    (
      'pike-push-up', 'bodyweight_reps', 'shoulders', '{triceps,chest}', 'bodyweight',
      'Flexiones en pica',
      array['pike push up'],
      array[
        'Apoya manos y pies en el suelo y sube la cadera hasta formar una V invertida.',
        'Dobla los codos y baja la cabeza hacia el suelo entre las manos.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'band-pull-apart', 'bodyweight_reps', 'shoulders', '{upper_back,traps}', 'band',
      'Separación de banda',
      array['aperturas con banda', 'band pull apart'],
      array[
        'Sujeta una banda elástica delante del pecho con los brazos estirados.',
        'Separa las manos hacia los lados hasta que la banda toque el pecho.',
        'Vuelve despacio.'
      ]
    ),

    -- Biceps -----------------------------------------------------------------
    (
      'barbell-curl', 'weight_reps', 'biceps', '{forearms}', 'barbell',
      'Curl de bíceps con barra',
      array['curl con barra', 'barbell curl'],
      array[
        'De pie, sujeta la barra con las palmas hacia delante a la anchura de los hombros.',
        'Dobla los codos y sube la barra sin mover los codos de los costados.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'ez-bar-curl', 'weight_reps', 'biceps', '{forearms}', 'ez_bar',
      'Curl con barra Z',
      array['curl barra z', 'ez bar curl'],
      array[
        'De pie, sujeta la barra Z por la parte inclinada con las palmas hacia delante.',
        'Sube la barra doblando los codos sin balancear el cuerpo.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'dumbbell-curl', 'weight_reps', 'biceps', '{forearms}', 'dumbbell',
      'Curl de bíceps con mancuernas',
      array['curl alterno', 'dumbbell curl'],
      array[
        'De pie, sujeta una mancuerna en cada mano con las palmas hacia delante.',
        'Sube las mancuernas doblando los codos, a la vez o alternando.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'hammer-curl', 'weight_reps', 'biceps', '{forearms}', 'dumbbell',
      'Curl martillo',
      array['curl neutro', 'hammer curl'],
      array[
        'De pie, sujeta las mancuernas con las palmas enfrentadas.',
        'Sube las mancuernas doblando los codos sin girar las muñecas.',
        'Baja despacio.'
      ]
    ),
    (
      'incline-dumbbell-curl', 'weight_reps', 'biceps', '{forearms}', 'dumbbell',
      'Curl inclinado con mancuernas',
      array['incline curl'],
      array[
        'Siéntate en un banco inclinado con los brazos colgando y una mancuerna en cada mano.',
        'Sube las mancuernas doblando los codos sin adelantarlos.',
        'Baja despacio hasta estirar los brazos por completo.'
      ]
    ),
    (
      'preacher-curl', 'weight_reps', 'biceps', '{forearms}', 'ez_bar',
      'Curl en banco Scott',
      array['curl predicador', 'curl scott', 'preacher curl'],
      array[
        'Siéntate en el banco Scott con la parte de atrás de los brazos apoyada en el cojín.',
        'Sujeta la barra Z y súbela doblando los codos.',
        'Baja despacio sin llegar a bloquear los codos.'
      ]
    ),
    (
      'concentration-curl', 'weight_reps', 'biceps', '{}', 'dumbbell',
      'Curl concentrado',
      array['concentration curl'],
      array[
        'Siéntate en un banco y apoya el codo en la cara interna del muslo.',
        'Sube la mancuerna hacia el hombro doblando el codo.',
        'Baja despacio. Cambia de lado al terminar.'
      ]
    ),
    (
      'spider-curl', 'weight_reps', 'biceps', '{}', 'dumbbell',
      'Curl araña',
      array['spider curl'],
      array[
        'Túmbate boca abajo en un banco inclinado con los brazos colgando en vertical.',
        'Sube las mancuernas doblando los codos.',
        'Baja despacio hasta estirar los brazos.'
      ]
    ),
    (
      'cable-curl', 'weight_reps', 'biceps', '{forearms}', 'cable',
      'Curl de bíceps en polea',
      array['curl en polea baja', 'cable curl'],
      array[
        'De pie frente a la polea baja, agarra la barra con las palmas hacia arriba.',
        'Sube la barra doblando los codos sin moverlos de los costados.',
        'Baja despacio.'
      ]
    ),
    (
      'rope-hammer-curl', 'weight_reps', 'biceps', '{forearms}', 'cable',
      'Curl martillo con cuerda en polea',
      array['rope hammer curl'],
      array[
        'Coloca la cuerda en la polea baja y agárrala con las palmas enfrentadas.',
        'Sube la cuerda doblando los codos.',
        'Baja despacio.'
      ]
    ),
    (
      'machine-biceps-curl', 'weight_reps', 'biceps', '{}', 'machine',
      'Curl de bíceps en máquina',
      array['machine curl'],
      array[
        'Ajusta el asiento para que los codos queden alineados con el eje de la máquina.',
        'Sube las asas doblando los codos.',
        'Baja despacio.'
      ]
    ),

    -- Triceps ----------------------------------------------------------------
    (
      'triceps-pushdown', 'weight_reps', 'triceps', '{}', 'cable',
      'Extensión de tríceps en polea alta',
      array['jalón de tríceps', 'tríceps en polea', 'pushdown'],
      array[
        'De pie frente a la polea alta, agarra la barra con las palmas hacia abajo.',
        'Con los codos pegados al cuerpo, empuja la barra hacia abajo hasta estirar los brazos.',
        'Sube despacio hasta que los antebrazos queden paralelos al suelo.'
      ]
    ),
    (
      'rope-pushdown', 'weight_reps', 'triceps', '{}', 'cable',
      'Extensión de tríceps con cuerda',
      array['tríceps con cuerda', 'rope pushdown'],
      array[
        'Coloca la cuerda en la polea alta y agárrala con las palmas enfrentadas.',
        'Con los codos pegados al cuerpo, baja la cuerda separando las manos al final.',
        'Sube despacio.'
      ]
    ),
    (
      'single-arm-cable-pushdown', 'weight_reps', 'triceps', '{}', 'cable',
      'Extensión de tríceps a una mano en polea',
      array['single arm pushdown'],
      array[
        'Agarra el estribo de la polea alta con una mano.',
        'Con el codo pegado al cuerpo, empuja hacia abajo hasta estirar el brazo.',
        'Sube despacio. Cambia de lado al terminar.'
      ]
    ),
    (
      'overhead-cable-triceps-extension', 'weight_reps', 'triceps', '{}', 'cable',
      'Extensión de tríceps sobre la cabeza en polea',
      array['tríceps francés en polea', 'overhead cable extension'],
      array[
        'De espaldas a la polea, sujeta la cuerda detrás de la cabeza con los codos hacia arriba.',
        'Estira los brazos hacia delante y arriba sin mover los codos.',
        'Vuelve despacio hasta notar el estiramiento.'
      ]
    ),
    (
      'dumbbell-overhead-triceps-extension', 'weight_reps', 'triceps', '{}', 'dumbbell',
      'Extensión de tríceps sobre la cabeza con mancuerna',
      array['copa', 'extensión tras nuca', 'overhead triceps extension'],
      array[
        'Sentado o de pie, sujeta una mancuerna con las dos manos por encima de la cabeza.',
        'Baja la mancuerna detrás de la cabeza doblando los codos.',
        'Estira los brazos hasta volver arriba.'
      ]
    ),
    (
      'skull-crusher', 'weight_reps', 'triceps', '{}', 'ez_bar',
      'Press francés con barra Z',
      array['press francés', 'rompecráneos', 'skull crusher'],
      array[
        'Túmbate en el banco y sujeta la barra Z sobre el pecho con los brazos estirados.',
        'Dobla solo los codos y baja la barra hacia la frente.',
        'Estira los brazos hasta volver arriba.'
      ]
    ),
    (
      'triceps-kickback', 'weight_reps', 'triceps', '{}', 'dumbbell',
      'Patada de tríceps con mancuerna',
      array['kickback'],
      array[
        'Apoya una mano y una rodilla en el banco con el tronco paralelo al suelo.',
        'Con el codo pegado al cuerpo, estira el brazo hacia atrás.',
        'Vuelve despacio. Cambia de lado al terminar.'
      ]
    ),
    (
      'machine-triceps-extension', 'weight_reps', 'triceps', '{}', 'machine',
      'Extensión de tríceps en máquina',
      array['triceps machine'],
      array[
        'Ajusta el asiento y apoya los codos en el cojín.',
        'Empuja las asas hasta estirar los brazos.',
        'Vuelve despacio.'
      ]
    ),
    (
      'close-grip-bench-press', 'weight_reps', 'triceps', '{chest,shoulders}', 'barbell',
      'Press de banca con agarre estrecho',
      array['press cerrado', 'close grip bench press'],
      array[
        'Túmbate en el banco y agarra la barra con las manos a la anchura de los hombros.',
        'Baja la barra hacia la parte baja del pecho con los codos pegados al cuerpo.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'bench-dip', 'bodyweight_reps', 'triceps', '{chest,shoulders}', 'bodyweight',
      'Fondos en banco',
      array['fondos entre bancos', 'bench dips'],
      array[
        'Apoya las manos en el borde de un banco detrás de ti con las piernas estiradas.',
        'Baja la cadera doblando los codos hasta unos 90 grados.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'triceps-dip', 'bodyweight_reps', 'triceps', '{chest,shoulders}', 'bodyweight',
      'Fondos en paralelas para tríceps',
      array['fondos de tríceps'],
      array[
        'Sujétate en las paralelas con los brazos estirados y el tronco vertical.',
        'Baja doblando los codos pegados al cuerpo.',
        'Empuja hasta estirar los brazos.'
      ]
    ),
    (
      'diamond-push-up', 'bodyweight_reps', 'triceps', '{chest,shoulders}', 'bodyweight',
      'Flexiones diamante',
      array['flexiones cerradas', 'diamond push up'],
      array[
        'Apoya las manos juntas bajo el pecho, tocándose índices y pulgares.',
        'Baja el pecho hacia las manos con los codos pegados al cuerpo.',
        'Empuja hasta estirar los brazos.'
      ]
    ),

    -- Forearms ---------------------------------------------------------------
    (
      'wrist-curl', 'weight_reps', 'forearms', '{}', 'barbell',
      'Curl de muñeca con barra',
      array['flexión de muñeca', 'wrist curl'],
      array[
        'Siéntate con los antebrazos sobre los muslos y las palmas hacia arriba sujetando la barra.',
        'Sube la barra doblando solo las muñecas.',
        'Baja despacio.'
      ]
    ),
    (
      'reverse-curl', 'weight_reps', 'forearms', '{biceps}', 'barbell',
      'Curl invertido con barra',
      array['curl prono', 'reverse curl'],
      array[
        'De pie, sujeta la barra con las palmas hacia abajo.',
        'Sube la barra doblando los codos sin moverlos de los costados.',
        'Baja despacio.'
      ]
    ),

    -- Legs -------------------------------------------------------------------
    (
      'barbell-back-squat', 'weight_reps', 'quadriceps', '{glutes,hamstrings,lower_back}', 'barbell',
      'Sentadilla con barra',
      array['sentadilla trasera', 'back squat', 'squat'],
      array[
        'Coloca la barra sobre la parte alta de la espalda y sepárate de los soportes.',
        'Abre los pies a la anchura de los hombros con las puntas algo hacia fuera.',
        'Baja llevando la cadera atrás y las rodillas en la dirección de los pies.',
        'Sube empujando el suelo hasta estar de pie.'
      ]
    ),
    (
      'front-squat', 'weight_reps', 'quadriceps', '{glutes,abs,upper_back}', 'barbell',
      'Sentadilla frontal con barra',
      array['front squat'],
      array[
        'Apoya la barra sobre la parte delantera de los hombros con los codos altos.',
        'Baja con el tronco lo más vertical posible.',
        'Sube empujando el suelo sin dejar caer los codos.'
      ]
    ),
    (
      'goblet-squat', 'weight_reps', 'quadriceps', '{glutes,abs}', 'dumbbell',
      'Sentadilla goblet',
      array['sentadilla copa', 'goblet squat'],
      array[
        'Sujeta una mancuerna o una kettlebell delante del pecho con las dos manos.',
        'Baja en sentadilla manteniendo el pecho alto.',
        'Sube empujando el suelo.'
      ]
    ),
    (
      'smith-machine-squat', 'weight_reps', 'quadriceps', '{glutes,hamstrings}', 'smith_machine',
      'Sentadilla en multipower',
      array['smith squat'],
      array[
        'Colócate bajo la barra del multipower con los pies algo adelantados.',
        'Suelta los seguros y baja en sentadilla.',
        'Sube empujando el suelo hasta estar de pie.'
      ]
    ),
    (
      'hack-squat', 'weight_reps', 'quadriceps', '{glutes}', 'machine',
      'Sentadilla hack',
      array['sentadilla jaca', 'hack squat'],
      array[
        'Apoya la espalda y los hombros en la máquina con los pies en la plataforma.',
        'Suelta los seguros y baja doblando las rodillas.',
        'Sube empujando la plataforma.'
      ]
    ),
    (
      'leg-press', 'weight_reps', 'quadriceps', '{glutes,hamstrings}', 'machine',
      'Prensa de piernas',
      array['prensa', 'prensa inclinada', 'leg press'],
      array[
        'Siéntate en la prensa con los pies en la plataforma a la anchura de los hombros.',
        'Suelta los seguros y baja la plataforma doblando las rodillas.',
        'Empuja hasta casi estirar las piernas sin bloquear las rodillas.'
      ]
    ),
    (
      'bulgarian-split-squat', 'weight_reps', 'quadriceps', '{glutes,hamstrings}', 'dumbbell',
      'Sentadilla búlgara',
      array['zancada búlgara', 'bulgarian split squat'],
      array[
        'De espaldas a un banco, apoya en él el empeine de un pie con una mancuerna en cada mano.',
        'Baja doblando la rodilla de delante hasta que la de atrás casi toque el suelo.',
        'Sube empujando con la pierna de delante. Cambia de lado al terminar.'
      ]
    ),
    (
      'dumbbell-lunge', 'weight_reps', 'quadriceps', '{glutes,hamstrings}', 'dumbbell',
      'Zancadas con mancuernas',
      array['estocadas', 'desplantes', 'lunges'],
      array[
        'De pie, sujeta una mancuerna en cada mano.',
        'Da un paso largo al frente y baja hasta que la rodilla de atrás casi toque el suelo.',
        'Empuja con la pierna de delante para volver. Alterna las piernas.'
      ]
    ),
    (
      'walking-lunge', 'weight_reps', 'quadriceps', '{glutes,hamstrings}', 'dumbbell',
      'Zancadas caminando',
      array['zancadas en movimiento', 'walking lunges'],
      array[
        'Sujeta una mancuerna en cada mano.',
        'Da un paso largo al frente y baja hasta que la rodilla de atrás casi toque el suelo.',
        'Sube y da el siguiente paso con la otra pierna, avanzando.'
      ]
    ),
    (
      'barbell-reverse-lunge', 'weight_reps', 'quadriceps', '{glutes,hamstrings}', 'barbell',
      'Zancada atrás con barra',
      array['zancada inversa', 'reverse lunge'],
      array[
        'Coloca la barra sobre la parte alta de la espalda.',
        'Da un paso largo atrás y baja hasta que la rodilla casi toque el suelo.',
        'Vuelve empujando con la pierna de delante. Alterna las piernas.'
      ]
    ),
    (
      'lateral-lunge', 'bodyweight_reps', 'adductors', '{quadriceps,glutes}', 'bodyweight',
      'Zancada lateral',
      array['side lunge', 'lateral lunge'],
      array[
        'De pie, da un paso amplio hacia un lado.',
        'Dobla la rodilla de ese lado llevando la cadera atrás y deja la otra pierna estirada.',
        'Empuja para volver al centro. Alterna los lados.'
      ]
    ),
    (
      'step-up', 'weight_reps', 'quadriceps', '{glutes}', 'dumbbell',
      'Subidas al banco con mancuernas',
      array['subida al cajón', 'step up'],
      array[
        'De pie frente a un banco o un cajón, con una mancuerna en cada mano.',
        'Apoya un pie entero encima y sube empujando con esa pierna.',
        'Baja despacio. Alterna las piernas.'
      ]
    ),
    (
      'dumbbell-sumo-squat', 'weight_reps', 'quadriceps', '{glutes,adductors}', 'dumbbell',
      'Sentadilla sumo con mancuerna',
      array['plié', 'sumo squat'],
      array[
        'Abre los pies bastante más que los hombros con las puntas hacia fuera.',
        'Sujeta una mancuerna entre las piernas con los brazos estirados.',
        'Baja con el tronco recto y sube empujando el suelo.'
      ]
    ),
    (
      'bodyweight-squat', 'bodyweight_reps', 'quadriceps', '{glutes}', 'bodyweight',
      'Sentadilla sin peso',
      array['sentadilla libre', 'air squat'],
      array[
        'De pie, con los pies a la anchura de los hombros.',
        'Baja llevando la cadera atrás y los brazos al frente para equilibrarte.',
        'Sube empujando el suelo.'
      ]
    ),
    (
      'jump-squat', 'bodyweight_reps', 'quadriceps', '{glutes,calves}', 'bodyweight',
      'Sentadilla con salto',
      array['jump squat'],
      array[
        'Baja en sentadilla con los pies a la anchura de los hombros.',
        'Salta hacia arriba extendiendo piernas y cadera con fuerza.',
        'Aterriza suave doblando las rodillas y enlaza la siguiente repetición.'
      ]
    ),
    (
      'box-jump', 'bodyweight_reps', 'quadriceps', '{glutes,calves}', 'bodyweight',
      'Saltos al cajón',
      array['box jump'],
      array[
        'Colócate frente a un cajón estable con los pies a la anchura de la cadera.',
        'Baja un poco, balancea los brazos y salta sobre el cajón.',
        'Aterriza con los dos pies, ponte de pie y baja andando.'
      ]
    ),
    (
      'leg-extension', 'weight_reps', 'quadriceps', '{}', 'machine',
      'Extensión de cuádriceps',
      array['extensiones de piernas', 'sillón de cuádriceps', 'leg extension'],
      array[
        'Siéntate con la espalda apoyada y el rodillo sobre los tobillos.',
        'Estira las piernas hasta arriba.',
        'Baja despacio.'
      ]
    ),
    (
      'lying-leg-curl', 'weight_reps', 'hamstrings', '{calves}', 'machine',
      'Curl femoral tumbado',
      array['curl de isquios', 'femoral tumbado', 'leg curl'],
      array[
        'Túmbate boca abajo con el rodillo justo por encima de los talones.',
        'Dobla las rodillas llevando los talones hacia los glúteos.',
        'Baja despacio.'
      ]
    ),
    (
      'seated-leg-curl', 'weight_reps', 'hamstrings', '{calves}', 'machine',
      'Curl femoral sentado',
      array['femoral sentado', 'seated leg curl'],
      array[
        'Siéntate con el rodillo bajo los talones y el apoyo sobre los muslos.',
        'Dobla las rodillas llevando los talones hacia abajo y atrás.',
        'Vuelve despacio.'
      ]
    ),
    (
      'romanian-deadlift', 'weight_reps', 'hamstrings', '{glutes,lower_back}', 'barbell',
      'Peso muerto rumano con barra',
      array['peso muerto piernas semirrígidas', 'rdl', 'romanian deadlift'],
      array[
        'De pie, sujeta la barra delante de los muslos con las rodillas algo flexionadas.',
        'Lleva la cadera atrás bajando la barra pegada a las piernas con la espalda recta.',
        'Baja hasta notar el estiramiento detrás de las piernas y sube extendiendo la cadera.'
      ]
    ),
    (
      'dumbbell-romanian-deadlift', 'weight_reps', 'hamstrings', '{glutes,lower_back}', 'dumbbell',
      'Peso muerto rumano con mancuernas',
      array['dumbbell rdl'],
      array[
        'De pie, sujeta una mancuerna en cada mano delante de los muslos.',
        'Lleva la cadera atrás bajando las mancuernas cerca de las piernas.',
        'Sube extendiendo la cadera con la espalda recta.'
      ]
    ),
    (
      'nordic-hamstring-curl', 'bodyweight_reps', 'hamstrings', '{glutes}', 'bodyweight',
      'Curl nórdico',
      array['curl femoral nórdico', 'nordic curl'],
      array[
        'De rodillas sobre una superficie blanda, con los tobillos sujetos.',
        'Con el cuerpo recto, déjate caer hacia delante lo más despacio que puedas.',
        'Apóyate con las manos al llegar abajo y vuelve a subir.'
      ]
    ),
    (
      'hip-thrust', 'weight_reps', 'glutes', '{hamstrings}', 'barbell',
      'Hip thrust con barra',
      array['empuje de cadera', 'puente de glúteos con barra'],
      array[
        'Siéntate en el suelo con la espalda alta apoyada en un banco y la barra sobre la cadera.',
        'Con los pies firmes en el suelo, sube la cadera hasta que el tronco quede horizontal.',
        'Aprieta los glúteos arriba y baja despacio.'
      ]
    ),
    (
      'machine-hip-thrust', 'weight_reps', 'glutes', '{hamstrings}', 'machine',
      'Hip thrust en máquina',
      array['hip thrust machine'],
      array[
        'Siéntate en la máquina con la espalda apoyada y el cinturón sobre la cadera.',
        'Sube la cadera hasta que el tronco quede horizontal.',
        'Baja despacio.'
      ]
    ),
    (
      'glute-bridge', 'bodyweight_reps', 'glutes', '{hamstrings}', 'bodyweight',
      'Puente de glúteos',
      array['elevación de cadera', 'glute bridge'],
      array[
        'Túmbate boca arriba con las rodillas dobladas y los pies apoyados.',
        'Sube la cadera hasta alinear rodillas, cadera y hombros.',
        'Aprieta los glúteos arriba y baja despacio.'
      ]
    ),
    (
      'cable-glute-kickback', 'weight_reps', 'glutes', '{hamstrings}', 'cable',
      'Patada de glúteo en polea',
      array['patada trasera', 'cable kickback'],
      array[
        'Engancha la tobillera a la polea baja y sujétate a la máquina.',
        'Lleva la pierna estirada hacia atrás sin arquear la espalda.',
        'Vuelve despacio. Cambia de lado al terminar.'
      ]
    ),
    (
      'machine-glute-kickback', 'weight_reps', 'glutes', '{hamstrings}', 'machine',
      'Patada de glúteo en máquina',
      array['glute kickback machine'],
      array[
        'Colócate en la máquina con el pie en la plataforma o tras el rodillo.',
        'Empuja la pierna hacia atrás hasta extender la cadera.',
        'Vuelve despacio. Cambia de lado al terminar.'
      ]
    ),
    (
      'cable-pull-through', 'weight_reps', 'glutes', '{hamstrings}', 'cable',
      'Pull through en polea',
      array['pull through'],
      array[
        'De espaldas a la polea baja, sujeta la cuerda entre las piernas.',
        'Lleva la cadera atrás con la espalda recta.',
        'Extiende la cadera hasta estar de pie apretando los glúteos.'
      ]
    ),
    (
      'hip-abduction-machine', 'weight_reps', 'abductors', '{glutes}', 'machine',
      'Abducción de cadera en máquina',
      array['abductores', 'hip abduction'],
      array[
        'Siéntate con los apoyos por fuera de las rodillas.',
        'Abre las piernas empujando hacia fuera.',
        'Vuelve despacio.'
      ]
    ),
    (
      'hip-adduction-machine', 'weight_reps', 'adductors', '{}', 'machine',
      'Aducción de cadera en máquina',
      array['aductores', 'hip adduction'],
      array[
        'Siéntate con los apoyos por dentro de las rodillas y las piernas abiertas.',
        'Cierra las piernas empujando hacia dentro.',
        'Vuelve despacio.'
      ]
    ),
    (
      'standing-calf-raise', 'weight_reps', 'calves', '{}', 'machine',
      'Elevación de talones de pie',
      array['gemelos de pie', 'standing calf raise'],
      array[
        'Colócate con los hombros bajo los apoyos y la punta de los pies en el escalón.',
        'Sube los talones todo lo que puedas.',
        'Baja despacio hasta notar el estiramiento.'
      ]
    ),
    (
      'seated-calf-raise', 'weight_reps', 'calves', '{}', 'machine',
      'Elevación de talones sentado',
      array['gemelos sentado', 'sóleo', 'seated calf raise'],
      array[
        'Siéntate con el apoyo sobre los muslos y la punta de los pies en el escalón.',
        'Sube los talones todo lo que puedas.',
        'Baja despacio hasta notar el estiramiento.'
      ]
    ),
    (
      'leg-press-calf-raise', 'weight_reps', 'calves', '{}', 'machine',
      'Elevación de talones en prensa',
      array['gemelos en prensa'],
      array[
        'Siéntate en la prensa con la punta de los pies en el borde de la plataforma.',
        'Con las piernas casi estiradas, empuja con las puntas.',
        'Vuelve despacio hasta notar el estiramiento.'
      ]
    ),
    (
      'kettlebell-swing', 'weight_reps', 'glutes', '{hamstrings,lower_back,shoulders}', 'kettlebell',
      'Swing con kettlebell',
      array['swing ruso', 'balanceo con pesa rusa', 'kettlebell swing'],
      array[
        'De pie, con los pies algo más abiertos que la cadera, sujeta la kettlebell con las dos manos.',
        'Llévala entre las piernas inclinando el tronco y la cadera atrás.',
        'Extiende la cadera con fuerza para que suba hasta la altura del pecho.',
        'Déjala bajar y enlaza la siguiente repetición.'
      ]
    ),

    -- Core -------------------------------------------------------------------
    (
      'plank', 'duration', 'abs', '{obliques,shoulders}', 'bodyweight',
      'Plancha',
      array['plancha abdominal', 'plank'],
      array[
        'Apoya los antebrazos en el suelo con los codos bajo los hombros.',
        'Estira las piernas y mantén el cuerpo en línea recta.',
        'Aprieta el abdomen y aguanta la posición sin hundir la cadera.'
      ]
    ),
    (
      'side-plank', 'duration', 'obliques', '{abs}', 'bodyweight',
      'Plancha lateral',
      array['side plank'],
      array[
        'Túmbate de lado y apoya el antebrazo con el codo bajo el hombro.',
        'Sube la cadera hasta que el cuerpo quede en línea recta.',
        'Aguanta la posición. Cambia de lado al terminar.'
      ]
    ),
    (
      'crunch', 'bodyweight_reps', 'abs', '{}', 'bodyweight',
      'Encogimientos abdominales',
      array['abdominales', 'crunch'],
      array[
        'Túmbate boca arriba con las rodillas dobladas y las manos junto a la cabeza.',
        'Despega los hombros del suelo acercando las costillas a la cadera.',
        'Baja despacio sin tirar del cuello.'
      ]
    ),
    (
      'reverse-crunch', 'bodyweight_reps', 'abs', '{}', 'bodyweight',
      'Crunch inverso',
      array['reverse crunch'],
      array[
        'Túmbate boca arriba con las piernas dobladas en el aire.',
        'Lleva las rodillas al pecho despegando la cadera del suelo.',
        'Baja despacio.'
      ]
    ),
    (
      'bicycle-crunch', 'bodyweight_reps', 'obliques', '{abs}', 'bodyweight',
      'Crunch bicicleta',
      array['bicicleta', 'bicycle crunch'],
      array[
        'Túmbate boca arriba con las manos junto a la cabeza y las piernas en el aire.',
        'Lleva un codo hacia la rodilla contraria mientras estiras la otra pierna.',
        'Alterna los lados de forma continua.'
      ]
    ),
    (
      'cable-crunch', 'weight_reps', 'abs', '{}', 'cable',
      'Crunch en polea alta',
      array['crunch de rodillas en polea', 'cable crunch'],
      array[
        'De rodillas frente a la polea alta, sujeta la cuerda junto a la cabeza.',
        'Encoge el tronco llevando los codos hacia los muslos.',
        'Vuelve despacio sin mover la cadera.'
      ]
    ),
    (
      'machine-crunch', 'weight_reps', 'abs', '{}', 'machine',
      'Crunch en máquina',
      array['ab machine'],
      array[
        'Ajusta el asiento y sujeta las asas o apoya el pecho en el cojín.',
        'Encoge el tronco hacia delante.',
        'Vuelve despacio.'
      ]
    ),
    (
      'hanging-leg-raise', 'bodyweight_reps', 'abs', '{forearms}', 'bodyweight',
      'Elevación de piernas colgado',
      array['hanging leg raise'],
      array[
        'Cuélgate de una barra con los brazos estirados.',
        'Sube las piernas hacia delante sin balancearte.',
        'Baja despacio.'
      ]
    ),
    (
      'captains-chair-knee-raise', 'bodyweight_reps', 'abs', '{}', 'bodyweight',
      'Elevación de rodillas en paralelas',
      array['silla romana', 'knee raise'],
      array[
        'Apoya los antebrazos en la silla romana con la espalda en el respaldo.',
        'Sube las rodillas hacia el pecho.',
        'Baja despacio sin balancearte.'
      ]
    ),
    (
      'lying-leg-raise', 'bodyweight_reps', 'abs', '{}', 'bodyweight',
      'Elevación de piernas tumbado',
      array['leg raise'],
      array[
        'Túmbate boca arriba con las piernas estiradas y las manos bajo la cadera.',
        'Sube las piernas hasta la vertical.',
        'Baja despacio sin que la zona lumbar se despegue del suelo.'
      ]
    ),
    (
      'russian-twist', 'bodyweight_reps', 'obliques', '{abs}', 'bodyweight',
      'Giros rusos',
      array['giro ruso', 'russian twist'],
      array[
        'Siéntate con las rodillas dobladas e inclina el tronco hacia atrás.',
        'Gira el tronco de un lado a otro llevando las manos junto a la cadera.',
        'Cuenta cada giro como una repetición.'
      ]
    ),
    (
      'ab-wheel-rollout', 'bodyweight_reps', 'abs', '{lats,shoulders}', 'other',
      'Rueda abdominal',
      array['rueda de abdominales', 'ab wheel'],
      array[
        'De rodillas, sujeta la rueda en el suelo bajo los hombros.',
        'Rueda hacia delante estirando el cuerpo sin hundir la zona lumbar.',
        'Vuelve tirando con el abdomen.'
      ]
    ),
    (
      'mountain-climber', 'duration', 'abs', '{shoulders,quadriceps}', 'bodyweight',
      'Escaladores',
      array['mountain climbers'],
      array[
        'Colócate en posición de flexión con los brazos estirados.',
        'Lleva una rodilla al pecho y cámbiala rápido por la otra.',
        'Mantén el ritmo sin levantar la cadera.'
      ]
    ),
    (
      'dead-bug', 'bodyweight_reps', 'abs', '{}', 'bodyweight',
      'Bicho muerto',
      array['dead bug'],
      array[
        'Túmbate boca arriba con los brazos hacia el techo y las rodillas dobladas en el aire.',
        'Estira a la vez un brazo hacia atrás y la pierna contraria hacia delante.',
        'Vuelve y alterna los lados sin despegar la zona lumbar del suelo.'
      ]
    ),
    (
      'hollow-hold', 'duration', 'abs', '{}', 'bodyweight',
      'Hollow hold',
      array['posición hueca', 'hollow body'],
      array[
        'Túmbate boca arriba con los brazos estirados por encima de la cabeza.',
        'Despega hombros y piernas del suelo con la zona lumbar pegada.',
        'Aguanta la posición.'
      ]
    ),
    (
      'pallof-press', 'weight_reps', 'obliques', '{abs}', 'cable',
      'Press Pallof',
      array['antirrotación', 'pallof press'],
      array[
        'De lado a la polea a la altura del pecho, sujeta el estribo con las dos manos.',
        'Estira los brazos al frente sin dejar que el cable te gire.',
        'Vuelve las manos al pecho. Cambia de lado al terminar.'
      ]
    ),
    (
      'cable-woodchop', 'weight_reps', 'obliques', '{abs,shoulders}', 'cable',
      'Leñador en polea',
      array['leñador', 'rotación en polea', 'woodchopper'],
      array[
        'De lado a la polea alta, sujeta el estribo con las dos manos.',
        'Tira en diagonal hacia la cadera contraria girando el tronco.',
        'Vuelve despacio. Cambia de lado al terminar.'
      ]
    ),

    -- Full body --------------------------------------------------------------
    (
      'burpee', 'bodyweight_reps', 'full_body', '{chest,quadriceps,shoulders}', 'bodyweight',
      'Burpees',
      array['burpee'],
      array[
        'Desde de pie, baja en cuclillas y apoya las manos en el suelo.',
        'Lleva los pies atrás hasta quedar en posición de flexión.',
        'Recoge los pies y salta hacia arriba con los brazos estirados.'
      ]
    ),
    (
      'power-clean', 'weight_reps', 'full_body', '{quadriceps,glutes,traps,shoulders}', 'barbell',
      'Cargada de potencia',
      array['cargada', 'power clean'],
      array[
        'Colócate como en el peso muerto con la barra sobre la mitad del pie.',
        'Sube la barra pegada al cuerpo y extiende con fuerza cadera y rodillas.',
        'Recibe la barra sobre los hombros con los codos al frente y las rodillas algo flexionadas.'
      ]
    ),
    (
      'thruster', 'weight_reps', 'full_body', '{quadriceps,glutes,shoulders,triceps}', 'barbell',
      'Thruster con barra',
      array['thruster'],
      array[
        'Sujeta la barra sobre la parte delantera de los hombros.',
        'Baja en sentadilla frontal.',
        'Al subir, aprovecha el impulso para empujar la barra por encima de la cabeza.'
      ]
    ),
    (
      'turkish-get-up', 'weight_reps', 'full_body', '{shoulders,abs,glutes}', 'kettlebell',
      'Levantamiento turco',
      array['turkish get up'],
      array[
        'Túmbate boca arriba con la kettlebell en una mano y el brazo estirado hacia el techo.',
        'Levántate paso a paso hasta estar de pie sin dejar de mirar la kettlebell.',
        'Deshaz los pasos hasta volver al suelo. Cambia de lado al terminar.'
      ]
    ),
    (
      'battle-ropes', 'duration', 'full_body', '{shoulders,abs}', 'other',
      'Cuerdas de batalla',
      array['cuerdas', 'battle ropes'],
      array[
        'Sujeta un extremo de cada cuerda con las rodillas algo flexionadas.',
        'Mueve los brazos arriba y abajo para crear ondas, a la vez o alternando.',
        'Mantén el ritmo durante el tiempo marcado.'
      ]
    ),
    (
      'jump-rope', 'duration', 'cardio', '{calves,shoulders}', 'other',
      'Comba',
      array['saltar a la comba', 'saltar la cuerda', 'jump rope'],
      array[
        'Sujeta la comba con los codos cerca del cuerpo.',
        'Gira la cuerda con las muñecas y salta justo cuando pase bajo los pies.',
        'Mantén saltos pequeños sobre la parte delantera de los pies.'
      ]
    ),

    -- Cardio machines --------------------------------------------------------
    (
      'treadmill-run', 'distance_duration', 'cardio', '{quadriceps,hamstrings,calves}', 'cardio_machine',
      'Correr en cinta',
      array['cinta de correr', 'treadmill'],
      array[
        'Sube a la cinta, ponte el clip de seguridad y empieza caminando.',
        'Sube la velocidad poco a poco hasta tu ritmo de carrera.',
        'Al terminar, baja la velocidad y camina unos minutos.'
      ]
    ),
    (
      'treadmill-incline-walk', 'distance_duration', 'cardio', '{glutes,calves}', 'cardio_machine',
      'Caminar en cinta inclinada',
      array['andar en cinta', 'caminata inclinada', 'incline walk'],
      array[
        'Sube a la cinta, ponte el clip de seguridad y empieza a caminar.',
        'Sube la inclinación hasta notar el esfuerzo sin agarrarte a las barras.',
        'Mantén un paso firme durante el tiempo marcado.'
      ]
    ),
    (
      'stationary-bike', 'distance_duration', 'cardio', '{quadriceps,glutes}', 'cardio_machine',
      'Bicicleta estática',
      array['bici estática', 'ciclo indoor', 'spinning'],
      array[
        'Ajusta el sillín para que la pierna quede casi estirada abajo.',
        'Pedalea a un ritmo cómodo para calentar.',
        'Ajusta la resistencia según el entreno.'
      ]
    ),
    (
      'rowing-machine', 'distance_duration', 'cardio', '{upper_back,quadriceps,lats}', 'cardio_machine',
      'Remoergómetro',
      array['máquina de remo', 'remo ergómetro', 'rower'],
      array[
        'Sujeta los pies con las cintas y agarra el asa.',
        'Empuja primero con las piernas, luego inclina el tronco y tira del asa hacia el pecho.',
        'Vuelve en orden inverso: brazos, tronco y piernas.'
      ]
    ),
    (
      'elliptical', 'calories_duration', 'cardio', '{quadriceps,glutes}', 'cardio_machine',
      'Elíptica',
      array['bicicleta elíptica', 'elliptical'],
      array[
        'Sube a los pedales y agarra las asas móviles.',
        'Mueve piernas y brazos en un ritmo continuo.',
        'Ajusta la resistencia según el entreno.'
      ]
    ),
    (
      'stair-climber', 'calories_duration', 'cardio', '{glutes,quadriceps,calves}', 'cardio_machine',
      'Máquina de escaleras',
      array['escaladora', 'stair master', 'stepper'],
      array[
        'Sube a la máquina y empieza a un ritmo lento.',
        'Pisa cada escalón con el pie entero y el tronco recto.',
        'Apóyate en las barras solo para mantener el equilibrio.'
      ]
    ),
    (
      'air-bike', 'calories_duration', 'cardio', '{quadriceps,shoulders}', 'cardio_machine',
      'Bicicleta de aire',
      array['air bike', 'assault bike'],
      array[
        'Ajusta el sillín y agarra las asas.',
        'Pedalea empujando y tirando de las asas a la vez.',
        'Cuanto más rápido vayas, más resistencia notarás.'
      ]
    ),
    (
      'ski-erg', 'distance_duration', 'cardio', '{lats,triceps,abs}', 'cardio_machine',
      'Ski erg',
      array['ergómetro de esquí', 'skierg'],
      array[
        'De pie frente a la máquina, agarra las asas por encima de la cabeza.',
        'Tira hacia abajo doblando la cadera y las rodillas a la vez.',
        'Vuelve arriba estirando el cuerpo y repite con ritmo.'
      ]
    )
), inserted as (
  insert into public.exercises (slug, tracking_type, primary_muscle, secondary_muscles, equipment)
  select
    slug,
    tracking_type::public.exercise_tracking_type,
    primary_muscle::public.muscle_group,
    secondary_muscles::public.muscle_group[],
    equipment::public.equipment_type
  from library
  returning id, slug
)
insert into public.exercise_translations (exercise_id, locale, name, aliases, instructions)
select inserted.id, 'es-ES', library.name, library.aliases, library.instructions
from inserted
join library using (slug);
