const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();

  try {
    console.log('Consultando usuarios en la base de datos...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        provider: true,
        lastLogin: true,
      },
      take: 20,
    });

    console.log(`Total de usuarios encontrados: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      console.table(users);
    }

  } catch (error) {
    console.error('Error consultando usuarios:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
