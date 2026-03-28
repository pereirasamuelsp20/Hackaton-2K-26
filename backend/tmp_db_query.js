import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixUser() {
  await prisma.user.updateMany({
    where: { email: 'siddhi@gmail.com' },
    data: { email: '225siddhi0091@dbit.in' }
  });
  console.log('Fixed');
}

fixUser().finally(() => {
  prisma.$disconnect();
  pool.end();
});
