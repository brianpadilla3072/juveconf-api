/* eslint-disable prettier/prettier */
// Configuración de TypeScript para el seed
import { UserRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

interface UserSeedData {
  email: string;
  password: string;
  dni: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
  role: UserRole;
}

const prisma = new PrismaClient();

// Función para hashear contraseñas
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Crear usuario directamente en la base de datos
async function createUser(userData: UserSeedData) {
  const hashedPassword = await hashPassword(userData.password);
  return prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: {
      email: userData.email,
      password: hashedPassword,
      dni: userData.dni,
      name: userData.name,
      givenName: userData.givenName,
      familyName: userData.familyName,
      picture: userData.picture,
      locale: userData.locale,
      role: userData.role,
      provider: 'LOCAL',
      emailVerified: false,
    },
  });
}

async function seedUsers() {
  const users: UserSeedData[] = [
    {
      email: 'padillabrian@gmail.com',
      password: 'Norma3072',
      dni: '42469579',
      name: 'brian',
      givenName: 'brian',
      familyName: 'padilla',
      picture: 'https://example.com/brisa.jpg',
      locale: 'es-AR',
      role: UserRole.DEVELOPER,
    },
    {
      email: 'brisgabella@gmail.com',
      password: 'consagradosBri2025',
      dni: '00000001',
      name: 'Brisa',
      givenName: 'Brisa',
      familyName: 'Gabella',
      picture: 'https://example.com/brisa.jpg',
      locale: 'es-AR',
      role: UserRole.ADMIN,
    },
    {
      email: 'estefaniavicvazquez@hotmail.com',
      password: 'ConsagradosEstef2025',
      dni: '00000002',
      name: 'Estefania',
      givenName: 'Estefania',
      familyName: 'Vazquez',
      picture: 'https://example.com/estefania.jpg',
      locale: 'es-AR',
      role: UserRole.ADMIN,
    },
  ];

  for (const user of users) {
    try {
      await createUser(user);
      console.log(`Usuario registrado: ${user.email}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Error registrando usuario ${user.email}:`,
          error.message,
        );
      } else {
        console.error(
          `Error desconocido registrando usuario ${user.email}:`,
          String(error),
        );
      }
    }
  }
}

async function seedCombos(eventId: string) {
  const PRICE_PLANS = [
    { id: 'individual', name: 'Individual', minPersons: 1, price: 18000 },
    { id: '3-entradas', name: '3 Entradas', minPersons: 3, price: 50000 },
    { id: '4-entradas', name: '4 Entradas', minPersons: 4, price: 65000 },
    { id: '5-entradas', name: '5 Entradas', minPersons: 5, price: 82000 },
    { id: '6-entradas',
      name: '6 Entradas + 1 Gratis',
      minPersons: 7,
      price: 108000 }
  ];
  const year = new Date().getFullYear();

  for (const plan of PRICE_PLANS) {
    await prisma.combo.create({
      data: {
        name: plan.name,
        price: plan.price,
        minPersons: plan.minPersons,
        year,
        eventId, // Usamos el eventId proporcionado
      },
    });
    console.log(`Combo creado: ${plan.name}`);
  }
}

async function seedEvent() {
  const year = new Date().getFullYear();

  const event = await prisma.event.create({
    data: {
      year,
      topic: `Congreso Consagrados a Jesús ${year}`,
      capacity: 200,
      salesStartDate: new Date(),
      deletedAt: null,
    },
  });

  console.log('Evento "Congreso Consagrados a Jesús" creado con éxito.');
  return event.id; // Retornamos el eventId
}

// Función principal
async function main() {
  console.log('Iniciando seed...');

  try {
    // 1. Crear usuarios
    await seedUsers();

    // 2. Crear evento
    const eventId = await seedEvent();

    // 3. Crear combos
    await seedCombos(eventId);

    console.log('Seed completado exitosamente');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error durante el seed:', error.message);
    } else {
      console.error('Error desconocido durante el seed:', String(error));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
main().catch((error) => {
  console.error('Error inesperado en el seed:', error);
  process.exit(1);
});
