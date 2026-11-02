import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { generateTokensSource, type DesignTokensFile } from './generate';
import {
  contrastRatio,
  textColorTokens,
  themes,
  themeStylesheet,
  themeToCssVariables,
  type ColorToken,
  type ThemeMode,
} from './index';

const readRepoFile = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

describe('design tokens', () => {
  it('tokens.generated.ts is in sync with docs/design-tokens.json (run `pnpm tokens`)', () => {
    const json = JSON.parse(
      readRepoFile('../../../../docs/design-tokens.json'),
    ) as DesignTokensFile;
    expect(readRepoFile('./tokens.generated.ts')).toBe(generateTokensSource(json));
  });

  it('defines the same color tokens for dark and light', () => {
    expect(Object.keys(themes.light.colors)).toEqual(Object.keys(themes.dark.colors));
  });

  it('converts sizes to pixels', () => {
    expect(themes.dark.spacing[4]).toBe(16);
    expect(themes.dark.radius.lg).toBe(18);
    expect(themes.dark.sizes.touchMin).toBe(44);
    expect(themes.dark.typography.displayXl.lineHeight).toBe(90);
    expect(themes.dark.typography.label.letterSpacing).toBe(0.66);
    expect(themes.dark.typography.label.textTransform).toBe('uppercase');
  });
});

describe('contrast (WCAG 4.5:1, docs/DESIGN.md)', () => {
  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });

  // [text color, background] pairs as described in the token usage notes.
  const pairs: Record<ThemeMode, [ColorToken, ColorToken][]> = {
    dark: [
      ['text', 'bg'],
      ['text', 'surface'],
      ['text', 'surface2'],
      ['textMuted', 'bg'],
      ['textMuted', 'surface'],
      ['textSubtle', 'bg'],
      ['textSubtle', 'surface'],
      ['accentText', 'bg'],
      ['accentText', 'surface'],
      ['inkOnLime', 'lime'],
      ['textOnSlab', 'slab'],
      ['lime', 'slab'],
      ['warm', 'surface'],
    ],
    light: [
      ['text', 'bg'],
      ['text', 'surface'],
      ['text', 'surface2'],
      ['textMuted', 'bg'],
      ['textMuted', 'surface'],
      // In light, text-subtle and warm only pass on white (surface), not on bg.
      ['textSubtle', 'surface'],
      ['accentText', 'bg'],
      ['accentText', 'surface'],
      ['inkOnLime', 'lime'],
      ['textOnSlab', 'slab'],
      ['lime', 'slab'],
      ['warm', 'surface'],
    ],
  };

  for (const mode of ['dark', 'light'] as const) {
    it.each(pairs[mode])(`${mode}: %s on %s is at least 4.5:1`, (foreground, background) => {
      const { colors } = themes[mode];
      expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(4.5);
    });
  }

  it('lime is never a text color (it fails on light backgrounds)', () => {
    expect(textColorTokens).not.toContain('lime');
    expect(contrastRatio(themes.light.colors.lime, themes.light.colors.bg)).toBeLessThan(4.5);
  });
});

describe('web CSS variables', () => {
  it('maps tokens to kebab-case custom properties', () => {
    const variables = themeToCssVariables(themes.light);
    expect(variables['--color-ink-on-lime']).toBe('#121316');
    expect(variables['--color-surface-2']).toBe('#e6e8eb');
    expect(variables['--space-4']).toBe('16px');
    expect(variables['--size-touch-min']).toBe('44px');
  });

  it('uses dark by default and light only when requested', () => {
    const css = themeStylesheet(themes);
    expect(css.startsWith(':root {\n  color-scheme: dark;')).toBe(true);
    expect(css).toContain('@media (prefers-color-scheme: light)');
  });
});
