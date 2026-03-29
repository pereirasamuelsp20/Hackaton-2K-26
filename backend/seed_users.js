import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedUsers() {
  const usersToCreate = [
    {
      name: 'Admin Samuel',
      email: '225samuel0032@dbit.in',
      password: '12345',
      role: 'Administrator'
    },
    {
      name: 'Nurse Siddhi',
      email: '225siddhi0091@dbit.in',
      password: '12345',
      role: 'Nurse'
    },
    {
      name: 'Doctor Ananya',
      email: '225ananya0117@dbit.in',
      password: '12345',
      role: 'Doctor'
    },
    {
      name: 'Cleaner Aditya',
      email: 'adityatol18@gmail.com',
      password: '12345',
      role: 'Cleaning Staff'
    }
  ];

  for (const user of usersToCreate) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('✅ Users seeded successfully!');
  const allUsers = await prisma.user.findMany();
  console.log('Current users:', allUsers.map(u => u.email));
}

seedUsers()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
