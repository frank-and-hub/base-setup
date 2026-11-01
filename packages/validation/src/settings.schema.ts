import { z } from 'zod';

export const updateSettingSchema = z.object({
  value: z.string().min(0),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

