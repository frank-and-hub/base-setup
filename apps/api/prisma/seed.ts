import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing users
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  // 1. Create Core Superadmin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: defaultPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Create Moderator
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@example.com' },
    update: {},
    create: {
      email: 'moderator@example.com',
      passwordHash: userPassword,
      firstName: 'Sarah',
      lastName: 'Connor',
      role: Role.MODERATOR,
      status: UserStatus.ACTIVE,
    },
  });

  // 3. Create Standard User
  const standardUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // 4. Create sample users for Data Table demonstration
  const sampleUsers = [
    { email: 'alex.rivera@example.com', firstName: 'Alex', lastName: 'Rivera', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'emily.watson@example.com', firstName: 'Emily', lastName: 'Watson', role: Role.MODERATOR, status: UserStatus.ACTIVE },
    { email: 'marcus.chen@example.com', firstName: 'Marcus', lastName: 'Chen', role: Role.USER, status: UserStatus.INACTIVE },
    { email: 'sophia.taylor@example.com', firstName: 'Sophia', lastName: 'Taylor', role: Role.ADMIN, status: UserStatus.ACTIVE },
    { email: 'david.kim@example.com', firstName: 'David', lastName: 'Kim', role: Role.USER, status: UserStatus.SUSPENDED },
    { email: 'olivia.brown@example.com', firstName: 'Olivia', lastName: 'Brown', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'liam.johnson@example.com', firstName: 'Liam', lastName: 'Johnson', role: Role.USER, status: UserStatus.INACTIVE },
    { email: 'emma.garcia@example.com', firstName: 'Emma', lastName: 'Garcia', role: Role.MODERATOR, status: UserStatus.ACTIVE },
    { email: 'noah.miller@example.com', firstName: 'Noah', lastName: 'Miller', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'ava.davis@example.com', firstName: 'Ava', lastName: 'Davis', role: Role.USER, status: UserStatus.ACTIVE },
    { email: 'lucas.martinez@example.com', firstName: 'Lucas', lastName: 'Martinez', role: Role.USER, status: UserStatus.SUSPENDED },
    { email: 'isabella.hernandez@example.com', firstName: 'Isabella', lastName: 'Hernandez', role: Role.USER, status: UserStatus.ACTIVE },
  ];

  for (const u of sampleUsers) {
    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: userPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: u.status,
      },
    });
  }

  console.log(`✅ Seeding finished successfully!`);
  console.log(`   Admin:     admin@example.com / Admin123!`);
  console.log(`   Moderator: moderator@example.com / User123!`);
  console.log(`   User:      user@example.com / User123!`);
  console.log(`   Total Users Seeded: ${sampleUsers.length + 3}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

