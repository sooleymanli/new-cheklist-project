import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new pg.default.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/facility_inspection?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  // User
  'user.view', 'user.create', 'user.update', 'user.delete',
  // Role
  'role.view', 'role.create', 'role.update', 'role.delete',
  // Permission
  'permission.view',
  // Building
  'building.view', 'building.create', 'building.update', 'building.delete',
  // Floor
  'floor.view', 'floor.create', 'floor.update', 'floor.delete',
  // Location
  'location.view', 'location.create', 'location.update', 'location.delete',
  // Checklist Template
  'checklist-template.view', 'checklist-template.create', 'checklist-template.update', 'checklist-template.delete', 'checklist-template.assign',
  // Checklist Instance
  'checklist-instance.view', 'checklist-instance.submit', 'checklist-instance.approve', 'checklist-instance.reject',
  // Incident
  'incident.view', 'incident.create', 'incident.update', 'incident.assign', 'incident.resolve',
  // QR
  'qr.generate', 'qr.scan',
  // Report
  'report.view', 'report.export',
  // Dashboard
  'dashboard.view',
  // Settings
  'settings.view', 'settings.update',
  // Audit
  'audit.view',
  // Notification
  'notification.view',
];

const ROLES = {
  'Super Admin': PERMISSIONS, // all
  'Admin': PERMISSIONS.filter(p => !p.startsWith('role.') && !p.startsWith('permission.')),
  'Supervisor': [
    'user.view',
    'building.view', 'floor.view', 'location.view',
    'checklist-template.view',
    'checklist-instance.view', 'checklist-instance.approve', 'checklist-instance.reject',
    'incident.view', 'incident.assign', 'incident.resolve',
    'report.view', 'report.export',
    'dashboard.view',
    'notification.view',
  ],
  'Inspector': [
    'building.view', 'floor.view', 'location.view',
    'checklist-instance.view', 'checklist-instance.submit',
    'incident.view', 'incident.create',
    'qr.scan',
    'dashboard.view',
    'notification.view',
  ],
  'Auditor': [
    'user.view',
    'building.view', 'floor.view', 'location.view',
    'checklist-template.view', 'checklist-instance.view',
    'incident.view',
    'report.view', 'report.export',
    'dashboard.view',
    'audit.view',
    'notification.view',
  ],
};

async function main() {
  console.log('🌱 Seeding database...');

  // Create permissions
  console.log('  Creating permissions...');
  for (const name of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name, description: name.replace('.', ' → ') },
    });
  }

  // Create roles and assign permissions
  console.log('  Creating roles...');
  for (const [roleName, rolePermissions] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} role` },
    });

    // Get permission IDs
    const permissionRecords = await prisma.permission.findMany({
      where: { name: { in: rolePermissions } },
    });

    // Clear existing and reassign
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissionRecords.map(p => ({ roleId: role.id, permissionId: p.id })),
    });
  }

  // Create admin user
  console.log('  Creating admin user...');
  const adminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  if (!adminRole) throw new Error('Super Admin role not found');

  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@facility.com' },
    update: { isActive: true },
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@facility.com',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      position: 'System Administrator',
      isActive: true,
    },
  });

  console.log('✅ Seed completed!');
  console.log('   Admin login: admin@facility.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
