/* region imports */
import * as z from 'zod';
/* endregion imports */

export const contactSchema = z.object({
  captcha: z.string().optional(),
  email: z.email(),
  message: z.string(),
  name: z.string(),
  reason: z.enum(['question', 'claim', 'delete', 'suggest']),
  record: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional())
});

export type ContactSchema = z.infer<typeof contactSchema>;
