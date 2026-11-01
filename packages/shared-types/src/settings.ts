export enum SettingType {
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  JSON = 'JSON',
}

export enum SettingCategory {
  GENERAL = 'GENERAL',
  SECURITY = 'SECURITY',
  AUTHENTICATION = 'AUTHENTICATION',
  UI = 'UI',
  NOTIFICATIONS = 'NOTIFICATIONS',
}

export interface Setting {
  setting_uuid: string;
  settingUuid?: string;
  key: string;
  value: string;
  type: SettingType;
  category: SettingCategory;
  is_public: boolean;
  isPublic?: boolean;
  description?: string | null;
  updated_by_uuid?: string | null;
  updatedByUuid?: string | null;
  created_at: string | Date;
  createdAt?: string | Date;
  updated_at: string | Date;
  updatedAt?: string | Date;
}

export interface UpdateSettingDto {
  value: string;
  description?: string;
  is_public?: boolean;
  isPublic?: boolean;
}
