import { UserRole } from './user';

export interface MenuItem {
  menu_uuid: string;
  menuUuid?: string;
  parent_uuid: string | null;
  parentUuid?: string | null;
  label: string;
  icon: string;
  route: string;
  display_order: number;
  displayOrder?: number;
  is_active: boolean;
  isActive?: boolean;
  required_permission: string | null;
  requiredPermission?: string | null;
  allowed_roles: UserRole[];
  allowedRoles?: UserRole[];
  children?: MenuItem[];
  created_at: string | Date;
  createdAt?: string | Date;
  updated_at: string | Date;
  updatedAt?: string | Date;
}

export interface CreateMenuItemDto {
  parent_uuid?: string | null;
  parentUuid?: string | null;
  label: string;
  icon: string;
  route: string;
  display_order?: number;
  displayOrder?: number;
  is_active?: boolean;
  isActive?: boolean;
  required_permission?: string | null;
  requiredPermission?: string | null;
  allowed_roles?: UserRole[];
  allowedRoles?: UserRole[];
}

export interface UpdateMenuItemDto {
  parent_uuid?: string | null;
  parentUuid?: string | null;
  label?: string;
  icon?: string;
  route?: string;
  display_order?: number;
  displayOrder?: number;
  is_active?: boolean;
  isActive?: boolean;
  required_permission?: string | null;
  requiredPermission?: string | null;
  allowed_roles?: UserRole[];
  allowedRoles?: UserRole[];
}
