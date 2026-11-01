import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  buildMenuTree,
  detectCircularReference,
  redactSensitiveData,
  parsePaginationParams,
  buildPaginatedResult,
  normalizeEntity,
} from '../dist/index.js';

describe('Shared Utilities Test Suite', () => {
  describe('Tree Utilities (buildMenuTree & detectCircularReference)', () => {
    test('should build hierarchical tree from flat menu list', () => {
      const items: any[] = [
        {
          menu_uuid: 'uuid-parent-1',
          label: 'Dashboard',
          route: '/admin/dashboard',
          icon: 'LayoutDashboard',
          order: 1,
          is_active: true,
          parent_uuid: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          menu_uuid: 'uuid-child-1',
          label: 'Analytics',
          route: '/admin/dashboard/analytics',
          icon: 'BarChart',
          order: 1,
          is_active: true,
          parent_uuid: 'uuid-parent-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const tree = buildMenuTree(items);
      assert.strictEqual(tree.length, 1);
      assert.strictEqual(tree[0].menu_uuid, 'uuid-parent-1');
      assert.strictEqual(tree[0].children?.length, 1);
      assert.strictEqual(tree[0].children?.[0].menu_uuid, 'uuid-child-1');
    });

    test('should detect direct circular reference (self-referencing)', () => {
      const items: any[] = [
        {
          menu_uuid: 'uuid-1',
          label: 'Self Loop',
          route: '/admin/loop',
          order: 1,
          is_active: true,
          parent_uuid: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const isCircular = detectCircularReference('uuid-1', 'uuid-1', items);
      assert.strictEqual(isCircular, true);
    });

    test('should detect indirect circular reference loop (A -> B -> A)', () => {
      const items: any[] = [
        {
          menu_uuid: 'uuid-A',
          label: 'Menu A',
          route: '/admin/a',
          order: 1,
          is_active: true,
          parent_uuid: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          menu_uuid: 'uuid-B',
          label: 'Menu B',
          route: '/admin/b',
          order: 1,
          is_active: true,
          parent_uuid: 'uuid-A',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Setting parent of A to B creates A -> B -> A loop
      const isCircular = detectCircularReference('uuid-B', 'uuid-A', items);
      assert.strictEqual(isCircular, true);
    });

    test('should allow valid parent-child without circular reference', () => {
      const items: any[] = [
        {
          menu_uuid: 'uuid-A',
          label: 'Menu A',
          route: '/admin/a',
          order: 1,
          is_active: true,
          parent_uuid: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          menu_uuid: 'uuid-B',
          label: 'Menu B',
          route: '/admin/b',
          order: 1,
          is_active: true,
          parent_uuid: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const isCircular = detectCircularReference('uuid-B', 'uuid-A', items);
      assert.strictEqual(isCircular, false);
    });
  });

  describe('Sanitization (redactSensitiveData)', () => {
    test('should redact sensitive keys at root and nested levels', () => {
      const input = {
        email: 'user@example.com',
        password: 'SuperSecretPassword123!',
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIs...',
          refreshToken: 'refresh-token-secret',
        },
        client_secret: 'client-secret-key',
        nested: {
          secret: 'private-data',
          safeField: 'visible-data',
        },
      };

      const sanitized = redactSensitiveData(input) as any;
      assert.strictEqual(sanitized.email, 'user@example.com');
      assert.strictEqual(sanitized.password, '[REDACTED]');
      assert.strictEqual(sanitized.tokens.accessToken, '[REDACTED]');
      assert.strictEqual(sanitized.tokens.refreshToken, '[REDACTED]');
      assert.strictEqual(sanitized.client_secret, '[REDACTED]');
      assert.strictEqual(sanitized.nested.secret, '[REDACTED]');
      assert.strictEqual(sanitized.nested.safeField, 'visible-data');
    });
  });

  describe('Pagination Utilities', () => {
    test('should clamp page and limit within safe boundaries', () => {
      const parsed = parsePaginationParams({ page: -5, limit: 9999 });
      assert.strictEqual(parsed.page, 1);
      assert.strictEqual(parsed.limit, 100);
      assert.strictEqual(parsed.skip, 0);
    });

    test('should build paginated result with meta navigation flags', () => {
      const result = buildPaginatedResult(['item1', 'item2'], 25, 2, 10);
      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.meta.page, 2);
      assert.strictEqual(result.meta.limit, 10);
      assert.strictEqual(result.meta.totalItems, 25);
      assert.strictEqual(result.meta.totalPages, 3);
      assert.strictEqual(result.meta.hasNextPage, true);
      assert.strictEqual(result.meta.hasPrevPage, true);
    });
  });

  describe('Entity Normalization (normalizeEntity)', () => {
    test('should provide dual compatibility for snake_case and camelCase fields', () => {
      const rawUser = {
        user_uuid: '123e4567-e89b-12d3-a456-426614174000',
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+15551234567',
        is_active: true,
      };

      const normalized = normalizeEntity(rawUser) as any;
      // Original snake_case preserved
      assert.strictEqual(normalized.user_uuid, '123e4567-e89b-12d3-a456-426614174000');
      assert.strictEqual(normalized.first_name, 'John');
      assert.strictEqual(normalized.last_name, 'Doe');
      assert.strictEqual(normalized.phone_number, '+15551234567');
      assert.strictEqual(normalized.is_active, true);

      // Mapped camelCase available
      assert.strictEqual(normalized.userUuid, '123e4567-e89b-12d3-a456-426614174000');
      assert.strictEqual(normalized.id, '123e4567-e89b-12d3-a456-426614174000');
      assert.strictEqual(normalized.firstName, 'John');
      assert.strictEqual(normalized.lastName, 'Doe');
      assert.strictEqual(normalized.phoneNumber, '+15551234567');
      assert.strictEqual(normalized.isActive, true);
    });

    test('should recursively normalize nested objects and arrays', () => {
      const payload = {
        menu_items: [
          {
            menu_uuid: 'menu-1',
            parent_uuid: null,
            display_order: 1,
            sub_items: [
              {
                menu_uuid: 'menu-2',
                parent_uuid: 'menu-1',
                display_order: 1,
              },
            ],
          },
        ],
      };

      const normalized = normalizeEntity(payload) as any;
      assert.ok(Array.isArray(normalized.menu_items));
      assert.ok(Array.isArray(normalized.menuItems));
      assert.strictEqual(normalized.menuItems[0].menuUuid, 'menu-1');
      assert.strictEqual(normalized.menuItems[0].displayOrder, 1);
      assert.strictEqual(normalized.menuItems[0].subItems[0].menuUuid, 'menu-2');
      assert.strictEqual(normalized.menuItems[0].subItems[0].parentUuid, 'menu-1');
    });
  });
});
