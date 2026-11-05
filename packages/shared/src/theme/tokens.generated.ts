// AUTO-GENERATED from docs/design-tokens.json by `pnpm tokens`. Do not edit by hand.

export const themeModes = [
  "dark",
  "light"
] as const;

export const colorTokens = {
  "dark": {
    "lime": "#c6f432",
    "inkOnLime": "#121316",
    "accentText": "#c6f432",
    "bg": "#0e0f11",
    "surface": "#17191d",
    "surface2": "#202329",
    "slab": "#23272e",
    "textOnSlab": "#f2f3f5",
    "line": "#24272d",
    "lineStrong": "#3a3e45",
    "text": "#f2f3f5",
    "textMuted": "#9aa0a8",
    "textSubtle": "#8b919a",
    "warm": "#f5a524"
  },
  "light": {
    "lime": "#c6f432",
    "inkOnLime": "#121316",
    "accentText": "#3f5a00",
    "bg": "#eef0f2",
    "surface": "#ffffff",
    "surface2": "#e6e8eb",
    "slab": "#1a1d22",
    "textOnSlab": "#f2f3f5",
    "line": "#dadde1",
    "lineStrong": "#c4c8ce",
    "text": "#121316",
    "textMuted": "#5f6670",
    "textSubtle": "#6b717a",
    "warm": "#a35f0a"
  }
} as const;

export const fontFamilies = {
  "display": "\"Barlow Condensed\", \"Arial Narrow\", sans-serif",
  "sans": "Inter, system-ui, -apple-system, sans-serif"
} as const;

export const typeScale = {
  "displayXl": {
    "family": "display",
    "fontSize": 112,
    "lineHeight": 90,
    "fontWeight": 700
  },
  "displayL": {
    "family": "display",
    "fontSize": 40,
    "lineHeight": 38,
    "fontWeight": 700
  },
  "screenTitle": {
    "family": "display",
    "fontSize": 38,
    "lineHeight": 38,
    "fontWeight": 700
  },
  "metric": {
    "family": "display",
    "fontSize": 28,
    "lineHeight": 28,
    "fontWeight": 700
  },
  "heading": {
    "family": "sans",
    "fontSize": 18,
    "lineHeight": 24,
    "fontWeight": 700
  },
  "bodyStrong": {
    "family": "sans",
    "fontSize": 16,
    "lineHeight": 22,
    "fontWeight": 600
  },
  "body": {
    "family": "sans",
    "fontSize": 15,
    "lineHeight": 22,
    "fontWeight": 400
  },
  "caption": {
    "family": "sans",
    "fontSize": 13,
    "lineHeight": 18,
    "fontWeight": 500
  },
  "label": {
    "family": "sans",
    "fontSize": 11,
    "lineHeight": 14,
    "fontWeight": 600,
    "letterSpacing": 0.66
  }
} as const;

export const spacing = {
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "6": 24
} as const;

export const radius = {
  "sm": 9,
  "md": 12,
  "pill": 999
} as const;

export const sizes = {
  "touchMin": 44,
  "buttonPrimary": 52,
  "icon": 24
} as const;
