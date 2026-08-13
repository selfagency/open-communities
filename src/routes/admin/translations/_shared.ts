import { z } from 'zod/v4';

export const addSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().optional().default('')
});

export const saveSchema = z.object({
  entries: z.string().min(1, 'Entries are required'),
  key: z.string().min(1, 'Key is required')
});

export const deleteSchema = z.object({
  key: z.string().min(1, 'Key is required')
});
