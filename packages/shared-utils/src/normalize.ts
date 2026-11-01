function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Entity normalization utility
 * Seamlessly provides dual-compatibility for camelCase and snake_case properties.
 */
export function normalizeEntity<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => normalizeEntity(item)) as unknown as T;
  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const normalizedVal = normalizeEntity(val);
    result[key] = normalizedVal;

    if (key.includes('_')) {
      const camel = toCamelCase(key);
      if (!(camel in result)) {
        result[camel] = normalizedVal;
      }
    } else {
      const snake = toSnakeCase(key);
      if (!(snake in result)) {
        result[snake] = normalizedVal;
      }
    }
  }

  // Dual-map User identifiers and ID
  if (result.user_uuid && !result.id) result.id = result.user_uuid;
  if (result.userUuid && !result.id) result.id = result.userUuid;
  if (result.id && !result.user_uuid) result.user_uuid = result.id;
  if (result.id && !result.userUuid) result.userUuid = result.id;

  return result as T;
}
