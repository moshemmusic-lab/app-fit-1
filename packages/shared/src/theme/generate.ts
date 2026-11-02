// Turns docs/design-tokens.json (the design source of truth) into typed TypeScript.
// Kept free of imports so it can run directly with Node (see scripts/generate-tokens.ts).

export interface DesignTokensFile {
  color: {
    themes: { id: string }[];
    tokens: { name: string; value: Record<string, string> }[];
  };
  type: {
    families: Record<string, string>;
    groups: {
      family: string;
      styles: {
        name: string;
        fontSize: string;
        lineHeight: number | string;
        fontWeight: number;
        letterSpacing?: string;
      }[];
    }[];
  };
  spacing: { tokens: { name: string; value: string }[] };
  radius: { tokens: { name: string; value: string }[] };
  size: { tokens: { name: string; value: string }[] };
}

/** "ink-on-lime" → "inkOnLime", "surface-2" → "surface2". */
export function toCamelCase(name: string): string {
  return name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function px(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  if (!match?.[1]) throw new Error(`Expected a px value, got "${value}"`);
  return Number(match[1]);
}

function em(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)em$/.exec(value);
  if (!match?.[1]) throw new Error(`Expected an em value, got "${value}"`);
  return Number(match[1]);
}

function stripPrefix(name: string, prefix: string): string {
  if (!name.startsWith(prefix)) throw new Error(`Token "${name}" should start with "${prefix}"`);
  return name.slice(prefix.length);
}

const round = (value: number) => Math.round(value * 100) / 100;

export function generateTokensSource(file: DesignTokensFile): string {
  const modes = file.color.themes.map((theme) => theme.id);

  const colors: Record<string, Record<string, string>> = {};
  for (const mode of modes) {
    colors[mode] = {};
    for (const token of file.color.tokens) {
      const value = token.value[mode];
      if (!value || !/^#[0-9a-f]{6}$/i.test(value)) {
        throw new Error(`Color "${token.name}" has no valid hex value for theme "${mode}"`);
      }
      colors[mode][toCamelCase(token.name)] = value.toLowerCase();
    }
  }

  const typeScale: Record<string, Record<string, string | number>> = {};
  for (const group of file.type.groups) {
    if (!file.type.families[group.family]) {
      throw new Error(`Unknown font family "${group.family}"`);
    }
    for (const style of group.styles) {
      const fontSize = px(style.fontSize);
      // Unitless line heights are multipliers; React Native needs absolute pixels.
      const lineHeight =
        typeof style.lineHeight === 'number'
          ? Math.round(fontSize * style.lineHeight)
          : px(style.lineHeight);
      typeScale[toCamelCase(style.name)] = {
        family: group.family,
        fontSize,
        lineHeight,
        fontWeight: style.fontWeight,
        ...(style.letterSpacing
          ? { letterSpacing: round(fontSize * em(style.letterSpacing)) }
          : {}),
      };
    }
  }

  const spacing = Object.fromEntries(
    file.spacing.tokens.map((t) => [stripPrefix(t.name, 'space-'), px(t.value)]),
  );
  const radius = Object.fromEntries(
    file.radius.tokens.map((t) => [stripPrefix(t.name, 'radius-'), px(t.value)]),
  );
  const sizes = Object.fromEntries(file.size.tokens.map((t) => [toCamelCase(t.name), px(t.value)]));

  const constant = (name: string, value: unknown) =>
    `export const ${name} = ${JSON.stringify(value, null, 2)} as const;\n`;

  return [
    '// AUTO-GENERATED from docs/design-tokens.json by `pnpm tokens`. Do not edit by hand.\n',
    constant('themeModes', modes),
    constant('colorTokens', colors),
    constant('fontFamilies', file.type.families),
    constant('typeScale', typeScale),
    constant('spacing', spacing),
    constant('radius', radius),
    constant('sizes', sizes),
  ].join('\n');
}
