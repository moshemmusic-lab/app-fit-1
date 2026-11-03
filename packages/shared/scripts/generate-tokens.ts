// Regenerates src/theme/tokens.generated.ts from docs/design-tokens.json.
// Run with `pnpm tokens` after editing the design tokens.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { generateTokensSource, type DesignTokensFile } from '../src/theme/generate.ts';

const tokensPath = fileURLToPath(new URL('../../../docs/design-tokens.json', import.meta.url));
const outputPath = fileURLToPath(new URL('../src/theme/tokens.generated.ts', import.meta.url));

const json = JSON.parse(readFileSync(tokensPath, 'utf8')) as DesignTokensFile;
writeFileSync(outputPath, generateTokensSource(json));
console.log(`Theme tokens written to ${outputPath}`);
