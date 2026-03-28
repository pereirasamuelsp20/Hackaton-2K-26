import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.log.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.user.deleteMany();

  // Create Wards with beds + patients
  const wardDefs = [
    { name: 'Cardiology Ward', capacity: 20 },
    { name: 'Neurology Ward', capacity: 20 },
    { name: 'Pediatrics Ward', capacity: 20 },
    { name: 'General Surgery Ward', capacity: 20 },
  ];

  const patientNames = [
    'James Carter', 'Maria Garcia', 'Robert Chen', 'Priya Patel', 'Samuel Okafor',
    'Linda Thompson', 'Wei Zhang', 'Aisha Diallo', 'Carlos Romero', 'Emma Brown',
    'Haruto Tanaka', 'Fatima Al-Mansoori', 'David Kim', 'Nora Walsh', 'Ivan Petrov',
  ];
  const allergies = ['Penicillin', 'Aspirin', 'Sulfa', 'None', 'None', 'Latex', 'None'];

  let patientIndex = 0;

  for (const def of wardDefs) {
    const ward = await prisma.ward.create({ data: { name: def.name, capacity: def.capacity } });

    for (let i = 0; i < def.capacity; i++) {
      const prefix = def.name.substring(0, 2).toUpperCase();
      const number = `${prefix}-${String(i + 1).padStart(2, '0')}`;
      const isOccupied = patientIndex < patientNames.length;
      const status = isOccupied ? 'OCCUPIED' : (i === def.capacity - 1 ? 'NEEDS_CLEANING' : 'AVAILABLE');

      const bed = await prisma.bed.create({ data: { number, status, wardId: ward.id } });

      if (isOccupied) {
        await prisma.patient.create({
          data: {
            name: patientNames[patientIndex],
            age: 28 + patientIndex,
            dob: `19${70 + (patientIndex % 30)}-0${(patientIndex % 9) + 1}-15`,
            gender: patientIndex % 2 === 0 ? 'Female' : 'Male',
            allergies: allergies[patientIndex % allergies.length],
            history: `Admitted for observation. Day ${(patientIndex % 7) + 1} of treatment.`,
            medication: patientIndex % 3 === 0 ? 'Ceftriaxone 1g IV BID' : patientIndex % 3 === 1 ? 'Acetaminophen 500mg PRN' : 'Aspirin 81mg QD',
            bedId: bed.id,
          },
        });
        patientIndex++;
      }
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${wardDefs.length} wards created`);
  console.log(`   - ${patientIndex} patients seeded across beds`);
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

