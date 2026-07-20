/* region imports */
import { z } from 'zod';

const pocketbaseIdRegex = /^[a-z0-9]{15}$/;

export const contactSchema = z.object({
  captcha: z.string().optional(),
  email: z.email(),
  message: z.string(),
  name: z.string(),
  reason: z.enum(['question', 'claim', 'delete', 'suggest', 'transfer']),
  // Validate as a PocketBase record id to prevent arbitrary URL injection in admin email links
  record: z.preprocess((val) => (val === '' ? undefined : val), z.string().regex(pocketbaseIdRegex).optional())
});
