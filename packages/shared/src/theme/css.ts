import type { Theme, ThemeMode } from './index';

/** "inkOnLime" → "ink-on-lime", "surface2" → "surface-2". */
function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([a-z])(\d)/g, '$1-$2')
    .toLowerCase();
}

/** CSS custom properties for one theme, e.g. `--color-ink-on-lime: #121316`. */
export function themeToCssVariables(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const [name, value] of Object.entries(theme.colors)) {
    variables[`--color-${toKebabCase(name)}`] = value;
  }
  for (const [name, value] of Object.entries(theme.spacing)) {
    variables[`--space-${name}`] = `${value}px`;
  }
  for (const [name, value] of Object.entries(theme.radius)) {
    variables[`--radius-${name}`] = `${value}px`;
  }
  for (const [name, value] of Object.entries(theme.sizes)) {
    variables[`--size-${toKebabCase(name)}`] = `${value}px`;
  }
  return variables;
}

function block(selector: string, theme: Theme, mode: ThemeMode): string {
  const declarations = Object.entries(themeToCssVariables(theme))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  return `${selector} {\n  color-scheme: ${mode};\n${declarations}\n}`;
}

/**
 * Stylesheet for the web: dark by default, light when the system asks for it.
 * `data-theme` on <html> can force either theme.
 */
export function themeStylesheet(themes: Record<ThemeMode, Theme>): string {
  return [
    block(':root', themes.dark, 'dark'),
    `@media (prefers-color-scheme: light) {\n${block(':root:not([data-theme="dark"])', themes.light, 'light')}\n}`,
    block(':root[data-theme="light"]', themes.light, 'light'),
    block(':root[data-theme="dark"]', themes.dark, 'dark'),
  ].join('\n\n');
}
