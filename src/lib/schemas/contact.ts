/* region imports */
// biome-ignore lint/performance/noNamespaceImport: Zod namespace convention
import * as z from 'zod';
/* endregion imports */

export const contactSchema = z.object({
  captcha: z.string().optional(),
  email: z.email(),
  message: z.string(),
  name: z.string(),
  reason: z.enum(['question', 'claim', 'delete', 'suggest', 'transfer']),
  // Validate as UUID to prevent arbitrary URL injection in admin email links
  record: z.preprocess((val) => (val === '' ? undefined : val), z.string().uuid().optional())
});

export type ContactSchema = z.infer<typeof contactSchema>;
