import { z } from 'zod';

import { accountLimits } from './account';

/** Same limits as the database (routines.name, routine_folders.name). */
export const routineNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'nameRequired' })
  .max(accountLimits.routineNameMax, { error: 'nameTooLong' });

export const folderNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'nameRequired' })
  .max(accountLimits.folderNameMax, { error: 'nameTooLong' });
