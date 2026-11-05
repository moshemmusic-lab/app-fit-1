import { exportWorkoutsSchema, workoutSetsCsv, type CsvLabels } from '@app-fit/shared/export';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { supabase } from '@/lib/supabase';

export type ExportFormat = 'json' | 'csv';

interface ExportOptions {
  format: ExportFormat;
  /** The file's name, without folder. */
  fileName: string;
  /** Column names and set types for the CSV. */
  csvLabels: CsvLabels;
  dialogTitle: string;
}

const fileTypes = {
  json: { mimeType: 'application/json', UTI: 'public.json' },
  csv: { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' },
} as const;

/**
 * "Export my data": asks the server for everything it stores about the user, writes it to a
 * file on the phone and opens the share sheet (save to Files, mail it, AirDrop…).
 * The file is temporary: it lives in the cache folder until the system clears it.
 */
export async function exportMyData({ format, fileName, csvLabels, dialogTitle }: ExportOptions) {
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) throw error;

  const content =
    format === 'json'
      ? JSON.stringify(data, null, 2)
      : workoutSetsCsv(exportWorkoutsSchema.parse(data), csvLabels);

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(content);

  await Sharing.shareAsync(file.uri, { ...fileTypes[format], dialogTitle });
}
