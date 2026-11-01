import { z } from 'zod';
import { UserRole } from '@monorepo/shared-types';

export const createMenuItemSchema = z.object({
  parent_uuid: z.string().uuid().nullable().optional(),
  label: z.string().min(1, 'Label is required').max(100),
  icon: z.string().min(1, 'Icon name is required'),
  route: z.string().min(1, 'Route path is required'),
  display_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
  required_permission: z.string().nullable().optional(),
  allowed_roles: z.array(z.nativeEnum(UserRole)).default([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

