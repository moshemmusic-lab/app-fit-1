import type { WeightUnit } from '../schemas/account';

/** Exact definition of the international pound. */
export const KG_PER_LB = 0.45359237;

/** Weights are stored in kg (CLAUDE.md, data rule 4); the user may type them in lb. */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB;
}

export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

/** "102,5" or "102.5" → 102.5. Empty or invalid text → null. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '' || !/^\d*\.?\d*$/.test(normalized) || normalized === '.') return null;
  return Number(normalized);
}

/** Spanish formatting: decimal comma, at most `maxDecimals` decimals, no trailing zeros. */
export function formatDecimal(value: number, maxDecimals = 2): string {
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  return String(rounded).replace('.', ',');
}

/** "1:30", "90" or "1:02:03" → seconds. Invalid text → null. */
export function parseDuration(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const parts = trimmed.split(':');
  if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

/** 90 → "1:30", 3723 → "1:02:03". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`;
}
