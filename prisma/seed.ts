/* eslint-disable prettier/prettier */

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  const users = [
    {
      email: 'brisgabella@gmail.com',
      password: 'consagradosBri2025',
      dni: '00000001',
      name: 'Brisa',
      role: UserRole.ADMIN,
    },
    {
      email: 'estefaniavicvazquez@hotmail.com',
      password: 'ConsagradosEstef2025',
      dni: '00000002',
      name: 'Estefania',
      role: UserRole.ADMIN,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {}, // no actualizamos si ya existe
      create: {
        ...u,
        // omitimos deletedAt para que quede null
      },
    });
    console.log(`Usuario seed: ${u.email} (asegurado)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
