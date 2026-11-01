import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clean existing tables
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.setting.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.userActivityLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Seed Granular Permissions
  const permissionsList = [
    { code: 'users.read', name: 'View Users', category: 'User Management', description: 'Can read user profiles and lists' },
    { code: 'users.create', name: 'Create Users', category: 'User Management', description: 'Can create new users' },
    { code: 'users.update', name: 'Update Users', category: 'User Management', description: 'Can update user profiles and status' },
    { code: 'users.delete', name: 'Delete Users', category: 'User Management', description: 'Can delete users' },
    { code: 'users.view_activity', name: 'View User Activity', category: 'User Management', description: 'Can inspect user activity logs' },
    { code: 'roles.manage', name: 'Manage Roles', category: 'Access Control', description: 'Can create and assign roles' },
    { code: 'permissions.manage', name: 'Manage Permissions', category: 'Access Control', description: 'Can configure system permissions' },
    { code: 'navigation.manage', name: 'Manage Navigation', category: 'System', description: 'Can edit sidebar items and menu hierarchy' },
    { code: 'audit_logs.read', name: 'View Audit Logs', category: 'Audit & Compliance', description: 'Can read structured PostgreSQL audit records' },
    { code: 'error_logs.read', name: 'View Error Logs', category: 'Audit & Compliance', description: 'Can inspect MongoDB application error logs' },
    { code: 'settings.manage', name: 'Manage Settings', category: 'System', description: 'Can update application default settings' },
    { code: 'moderators.manage', name: 'Manage Moderators', category: 'Access Control', description: 'Can assign and supervise moderators' },
  ];

  const createdPermissions = new Map<string, string>();
  for (const p of permissionsList) {
    const created = await prisma.permission.create({
      data: {
        code: p.code,
        name: p.name,
        category: p.category,
        description: p.description,
      },
    });
    createdPermissions.set(p.code, created.permission_uuid);
  }

  // 2. Map Permissions to Roles
  // SUPER_ADMIN has ALL permissions
  for (const permUuid of createdPermissions.values()) {
    await prisma.rolePermission.create({
      data: { role: Role.SUPER_ADMIN, permission_uuid: permUuid },
    });
  }

  // ADMIN permissions
  const adminPermCodes = [
    'users.read', 'users.create', 'users.update', 'users.view_activity',
    'roles.manage', 'permissions.manage', 'navigation.manage', 'audit_logs.read', 'error_logs.read',
    'settings.manage', 'moderators.manage'
  ];
  for (const code of adminPermCodes) {
    const permUuid = createdPermissions.get(code);
    if (permUuid) {
      await prisma.rolePermission.create({
        data: { role: Role.ADMIN, permission_uuid: permUuid },
      });
    }
  }

  // MODERATOR permissions
  const modPermCodes = ['users.read', 'users.update', 'users.view_activity'];
  for (const code of modPermCodes) {
    const permUuid = createdPermissions.get(code);
    if (permUuid) {
      await prisma.rolePermission.create({
        data: { role: Role.MODERATOR, permission_uuid: permUuid },
      });
    }
  }

  // 3. Seed Users
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      password_hash: superAdminPassword,
      first_name: 'Super',
      last_name: 'Administrator',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      phone_number: '+1 (555) 000-0001',
      address: 'Headquarters, Silicon Valley, CA',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password_hash: adminPassword,
      first_name: 'Operations',
      last_name: 'Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phone_number: '+1 (555) 000-0002',
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@example.com',
      password_hash: userPassword,
      first_name: 'Community',
      last_name: 'Moderator',
      role: Role.MODERATOR,
      status: UserStatus.ACTIVE,
      phone_number: '+1 (555) 000-0003',
    },
  });

  const standardUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password_hash: userPassword,
      first_name: 'John',
      last_name: 'Doe',
      role: Role.USER,
      status: UserStatus.ACTIVE,
      phone_number: '+1 (555) 123-4567',
      address: '742 Evergreen Terrace, Springfield',
    },
  });

  // Additional mock users for data tables
  const demoUsers = [
    { email: 'alex.rivera@example.com', first_name: 'Alex', last_name: 'Rivera', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'emily.watson@example.com', first_name: 'Emily', last_name: 'Watson', role: Role.MODERATOR, status: UserStatus.ACTIVE },
    { email: 'marcus.chen@example.com', first_name: 'Marcus', last_name: 'Chen', role: Role.USER, status: UserStatus.INACTIVE },
    { email: 'sophia.taylor@example.com', first_name: 'Sophia', last_name: 'Taylor', role: Role.ADMIN, status: UserStatus.ACTIVE },
    { email: 'david.kim@example.com', first_name: 'David', last_name: 'Kim', role: Role.USER, status: UserStatus.SUSPENDED },
    { email: 'olivia.brown@example.com', first_name: 'Olivia', last_name: 'Brown', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'liam.johnson@example.com', first_name: 'Liam', last_name: 'Johnson', role: Role.USER, status: UserStatus.INACTIVE },
    { email: 'emma.garcia@example.com', first_name: 'Emma', last_name: 'Garcia', role: Role.MODERATOR, status: UserStatus.ACTIVE },
    { email: 'noah.miller@example.com', first_name: 'Noah', last_name: 'Miller', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'ava.davis@example.com', first_name: 'Ava', last_name: 'Davis', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'lucas.martinez@example.com', first_name: 'Lucas', last_name: 'Martinez', role: Role.USER, status: UserStatus.SUSPENDED },
    { email: 'isabella.hernandez@example.com', first_name: 'Isabella', last_name: 'Hernandez', role: Role.USER, status: UserStatus.ACTIVE },
  ];

  for (const du of demoUsers) {
    await prisma.user.create({
      data: {
        email: du.email,
        password_hash: userPassword,
        first_name: du.first_name,
        last_name: du.last_name,
        role: du.role,
        status: du.status,
      },
    });
  }

  // 4. Seed Dynamic Sidebar Navigation (All 11 Required Modules from Section 9.4)
  const menuDefs = [
    { label: 'Dashboard', icon: 'LayoutDashboard', route: '/admin/dashboard', display_order: 1, allowed_roles: 'SUPER_ADMIN,ADMIN,MODERATOR' },
    { label: 'Role & Permissions', icon: 'ShieldCheck', route: '/admin/roles', display_order: 2, required_permission: 'roles.manage', allowed_roles: 'SUPER_ADMIN,ADMIN' },
    { label: 'User Management', icon: 'Users', route: '/admin/users', display_order: 3, required_permission: 'users.read', allowed_roles: 'SUPER_ADMIN,ADMIN,MODERATOR' },
    { label: 'Moderator Management', icon: 'UserCheck', route: '/admin/moderators', display_order: 4, required_permission: 'moderators.manage', allowed_roles: 'SUPER_ADMIN,ADMIN' },
    { label: 'Navigation & Sidebar', icon: 'Menu', route: '/admin/navigation', display_order: 5, required_permission: 'navigation.manage', allowed_roles: 'SUPER_ADMIN' },
    { label: 'Audit Logs', icon: 'ScrollText', route: '/admin/audit-logs', display_order: 6, required_permission: 'audit_logs.read', allowed_roles: 'SUPER_ADMIN,ADMIN' },
    { label: 'User Activity Logs', icon: 'History', route: '/admin/activity-logs', display_order: 7, required_permission: 'users.view_activity', allowed_roles: 'SUPER_ADMIN,ADMIN,MODERATOR' },
    { label: 'Application Error Logs', icon: 'AlertOctagon', route: '/admin/error-logs', display_order: 8, required_permission: 'error_logs.read', allowed_roles: 'SUPER_ADMIN,ADMIN' },
    { label: 'Default Settings', icon: 'Settings', route: '/admin/settings', display_order: 9, required_permission: 'settings.manage', allowed_roles: 'SUPER_ADMIN,ADMIN' },
    { label: 'Profile Management', icon: 'User', route: '/admin/profile', display_order: 10, allowed_roles: 'SUPER_ADMIN,ADMIN,MODERATOR' },
    { label: 'System Health & Monitoring', icon: 'Activity', route: '/admin/health', display_order: 11, allowed_roles: 'SUPER_ADMIN,ADMIN' },
    { label: 'Codebase Knowledge Graph', icon: 'Network', route: '/admin/knowledge-graph', display_order: 12, allowed_roles: 'SUPER_ADMIN,ADMIN' },
  ];

  const parentMenuMap = new Map<string, string>();
  for (const m of menuDefs) {
    const created = await prisma.menuItem.create({
      data: {
        label: m.label,
        icon: m.icon,
        route: m.route,
        display_order: m.display_order,
        is_active: true,
        required_permission: m.required_permission || null,
        allowed_roles: m.allowed_roles,
      },
    });
    parentMenuMap.set(m.label, created.menu_uuid);
  }

  // Nested child menu items to demonstrate parent-child dynamic navigation hierarchy!
  const userMgmtUuid = parentMenuMap.get('User Management');
  if (userMgmtUuid) {
    await prisma.menuItem.create({
      data: {
        parent_uuid: userMgmtUuid,
        label: 'Active Users',
        icon: 'UserCheck',
        route: '/admin/users?status=ACTIVE',
        display_order: 1,
        is_active: true,
        required_permission: 'users.read',
        allowed_roles: 'SUPER_ADMIN,ADMIN,MODERATOR',
      },
    });
    await prisma.menuItem.create({
      data: {
        parent_uuid: userMgmtUuid,
        label: 'Suspended Users',
        icon: 'UserX',
        route: '/admin/users?status=SUSPENDED',
        display_order: 2,
        is_active: true,
        required_permission: 'users.read',
        allowed_roles: 'SUPER_ADMIN,ADMIN,MODERATOR',
      },
    });
  }

  // 5. Seed Default Application Settings (Section 9.11)
  const settingsList = [
    { key: 'app.name', value: 'Monorepo Enterprise Platform', type: 'STRING', category: 'GENERAL', is_public: true, description: 'Application display name' },
    { key: 'app.branding.logo_url', value: '/logo.svg', type: 'STRING', category: 'GENERAL', is_public: true, description: 'Brand logo path' },
    { key: 'auth.default_role', value: 'USER', type: 'STRING', category: 'AUTHENTICATION', is_public: false, description: 'Default role assigned on registration' },
    { key: 'auth.registration_enabled', value: 'true', type: 'BOOLEAN', category: 'AUTHENTICATION', is_public: true, description: 'Whether public registration is enabled' },
    { key: 'auth.session_timeout_minutes', value: '60', type: 'NUMBER', category: 'SECURITY', is_public: false, description: 'Idle session timeout in minutes' },
    { key: 'ui.pagination_default', value: '10', type: 'NUMBER', category: 'UI', is_public: true, description: 'Default items per page for data tables' },
    { key: 'app.timezone', value: 'UTC', type: 'STRING', category: 'GENERAL', is_public: true, description: 'System timezone' },
    { key: 'app.date_format', value: 'YYYY-MM-DD HH:mm:ss', type: 'STRING', category: 'UI', is_public: true, description: 'Display format for timestamps' },
    { key: 'notifications.email_alerts_enabled', value: 'true', type: 'BOOLEAN', category: 'NOTIFICATIONS', is_public: false, description: 'Enable system security alerts' },
  ];

  for (const s of settingsList) {
    await prisma.setting.create({
      data: {
        key: s.key,
        value: s.value,
        type: s.type,
        category: s.category,
        is_public: s.is_public,
        description: s.description,
        updated_by_uuid: superAdmin.user_uuid,
      },
    });
  }

  // 6. Seed Sample Structured Audit Logs (Section 9.12)
  const initialCorrelationId = crypto.randomUUID();
  await prisma.auditLog.create({
    data: {
      actor_uuid: superAdmin.user_uuid,
      actor_email: superAdmin.email,
      action: 'SYSTEM_INITIALIZED',
      resource_type: 'System',
      correlation_id: initialCorrelationId,
      outcome: 'SUCCESS',
      before_state: null,
      after_state: { version: '1.0.0', initialized_by: superAdmin.email },
      ip_address: '127.0.0.1',
      user_agent: 'SystemSeeder/1.0',
    },
  });

  // 7. Seed Sample User Activity Logs (Section 9.6)
  await prisma.userActivityLog.create({
    data: {
      user_uuid: superAdmin.user_uuid,
      actor_uuid: superAdmin.user_uuid,
      action: 'LOGIN',
      correlation_id: initialCorrelationId,
      metadata: { login_method: 'PASSWORD', mfa: false },
      ip_address: '127.0.0.1',
      user_agent: 'Chrome/120.0 Linux',
    },
  });

  console.log('✅ Comprehensive seeding completed successfully!');
  console.log('   Super Admin: superadmin@example.com / SuperAdmin123!');
  console.log('   Admin:       admin@example.com / Admin123!');
  console.log('   Moderator:   moderator@example.com / User123!');
  console.log('   User:        user@example.com / User123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
