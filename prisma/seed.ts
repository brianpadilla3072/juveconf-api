/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable prettier/prettier */
import { PrismaClient, UserRole, AuthProvider, PaymentType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUsers() {
  const users = [
    {
      email: 'brisgabella@gmail.com',
      password: 'consagradosBri2025',
      dni: '00000001',
      name: 'Brisa',
      givenName: 'Brisa',
      familyName: 'Gabella',
      nickname: 'brigi',
      picture: 'https://example.com/brisa.jpg',
      locale: 'es-AR',
      emailVerified: true,
      provider: AuthProvider.LOCAL,
      auth0Id: null,
      role: UserRole.ADMIN,
    },
    {
      email: 'estefaniavicvazquez@hotmail.com',
      password: 'ConsagradosEstef2025',
      dni: '00000002',
      name: 'Estefania',
      givenName: 'Estefania',
      familyName: 'Vazquez',
      nickname: 'estefi',
      picture: 'https://example.com/estefania.jpg',
      locale: 'es-AR',
      emailVerified: true,
      provider: AuthProvider.LOCAL,
      auth0Id: null,
      role: UserRole.ADMIN,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {}, // no actualizamos si ya existe
      create: {
        ...u,
        // deletedAt se omite para mantenerlo en null
      },
    });
    console.log(`Usuario seed: ${u.email} (asegurado)`);
  }
}

async function seedCombos(eventId: string) {
  const PRICE_PLANS = [
    { id: "individual", name: "Individual", minPersons: 1, price: 50 },
    { id: "small-group", name: "Grupo Pequeño", minPersons: 5, price: 40 },
    { id: "medium-group", name: "Grupo Mediano", minPersons: 6, price: 35 },
    { id: "large-group", name: "Grupo Grande", minPersons: 10, price: 30 },
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

async function main() {
  try {
    // Primero se crea el evento
    const eventId = await seedEvent();

    // Luego se crean los usuarios
    await seedUsers();

    // Finalmente, se crean los combos asociados al evento
    await seedCombos(eventId);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
