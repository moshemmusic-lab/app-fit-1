// Spanish (Spain) copy. Every user-facing string lives here, never in components.
// Voice: direct, second person, no emojis (docs/DESIGN.md).
export const es = {
  app: {
    name: 'Movyn',
  },
  tabs: {
    home: 'Inicio',
    workout: 'Entrenar',
    programs: 'Programas',
    progress: 'Progreso',
    profile: 'Perfil',
  },
  home: {
    emptyTitle: 'Todo listo para empezar',
    emptyBody: 'Aquí verás tus entrenos y los de la gente que sigues.',
  },
  workout: {
    emptyTitle: 'Aún no hay entrenos',
    emptyBody: 'Pronto podrás empezar un entreno vacío o desde una rutina.',
  },
  programs: {
    emptyTitle: 'Todavía no tienes programas',
    emptyBody: 'Los programas de tus creadores aparecerán aquí.',
  },
  progress: {
    emptyTitle: 'Tu progreso empieza con tu primer entreno',
    emptyBody: 'Aquí verás tu historial, tus récords y tus gráficas.',
  },
  profile: {
    appearance: 'Apariencia',
    appearanceHint: 'El tema oscuro es el predeterminado.',
    themeDark: 'Oscuro',
    themeLight: 'Claro',
    themeSystem: 'Sistema',
  },
  web: {
    title: 'Movyn',
    tagline: 'Registra cada serie en dos toques y entrena el programa de tu creador.',
    comingSoon: 'Muy pronto: panel de creadores y programas.',
  },
} as const;

export type Translation = typeof es;
