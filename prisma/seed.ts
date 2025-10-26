/* eslint-disable prettier/prettier */
import { UserRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seedUsers() {
  const users = [
    { email: 'padillabrian@gmail.com', password: 'Nopasaran3072', dni: '42469579', name: 'Brian Padilla', role: UserRole.DEVELOPER },
    { email: 'aldiruiz2024@gmail.com', password: 'aldiruiz20224', dni: '00000003', name: 'Aldana Micaela Ruiz Diaz', role: UserRole.ADMIN },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        password: await hashPassword(user.password),
        dni: user.dni,
        name: user.name,
        role: user.role,
        provider: 'LOCAL',
        emailVerified: false,
        locale: 'es-AR'
      },
    });
    console.log(`✅ Usuario: ${user.email}`);
  }
}

async function seedEvent() {
  const year = 2025;

  // Buscar si ya existe un evento para este año
  const existingEvent = await prisma.event.findFirst({
    where: { year },
  });

  if (existingEvent) {
    console.log(`✅ Evento ya existe: ${existingEvent.topic}`);
    return existingEvent.id;
  }

  const event = await prisma.event.create({
    data: {
      year,
      topic: 'JuveConf 2025 - Juventud en Conferencia',
      capacity: 500,
      salesStartDate: new Date('2025-01-01'),
      salesEndDate: new Date('2025-12-31'),
      eventStartDate: new Date('2025-11-14'), // Ajustar según fecha real del evento
      eventEndDate: new Date('2025-11-16'),   // Ajustar según fecha real del evento
      location: 'Bahía Blanca, Buenos Aires',
      description: 'Conferencia anual para jóvenes - JuveConf 2025',
      isActive: true,
    },
  });
  console.log(`✅ Evento creado: ${event.topic}`);
  return event.id;
}

async function seedCombos(eventId: string) {
  const combos = [
    {
      name: 'ESENCIAL',
      price: 0,
      persons: 1,
      max: 1,
      isFree: true,
      desc: 'Ideal si querés venir a las reuniones principales o no podés quedarte todo el fin de semana.',
      benefits: [
        'Acceso a las 4 plenarias generales',
        'Escuchá la Palabra de Dios junto a toda la comunidad',
        'Participación libre y abierta sin costo'
      ]
    },
    {
      name: 'COMPLETO',
      price: 10000,
      persons: 1,
      max: 10,
      isFree: false,
      desc: 'Ideal para vivir toda la experiencia completa de JUVEConfe',
      benefits: [
        'Acceso a las 4 plenarias generales',
        'Participación en todos los talleres',
        'Actividades deportivas',
        'Hospedaje gratuito en casa de los hermanos de la iglesia',
        'Kit completo de materiales para talleres',
        'Acceso al buffet oficial del evento (Las comidas no están incluidas)'
      ]
    },
    {
      name: 'PLUS',
      price: 30000,
      persons: 1,
      max: 10,
      isFree: false,
      desc: 'Ideal para quienes quieren todo el paquete completo y llevarse la remera oficial',
      benefits: [
        'Acceso a las 4 plenarias generales',
        'Participación en todos los talleres',
        'Actividades deportivas',
        'Hospedaje gratuito en casa de los hermanos de la iglesia',
        'Kit completo de materiales para talleres',
        'Acceso al buffet oficial del evento (Las comidas no están incluidas)',
        'Remera oficial'
      ],
      merchandise: {
        enabled: true,
        allMerchandise: [
          {
            type: 'remera',
            label: 'Remera oficial JUVECONF 2025',
            sizes: ['S', 'M', 'L', 'XL']
          }
        ]
      }
    }
  ];

  const created: any[] = [];
  for (let i = 0; i < combos.length; i++) {
    const c = combos[i];

    // Buscar si ya existe
    const existingCombo = await prisma.combo.findFirst({
      where: {
        eventId,
        name: c.name
      },
    });

    if (existingCombo) {
      created.push(existingCombo);
      console.log(`✅ Combo ya existe: ${c.name}`);
      continue;
    }

    const combo = await prisma.combo.create({
      data: {
        name: c.name,
        price: c.price,
        personsIncluded: c.persons,
        maxPersons: c.max,
        eventId,
        isActive: true,
        isPublished: true,
        isFree: c.isFree,
        description: c.desc,
        displayOrder: i + 1,
        metadata: c.merchandise
          ? { benefits: c.benefits, merchandise: c.merchandise }
          : { benefits: c.benefits }
      },
    });
    created.push(combo);
    console.log(`✅ Combo: ${c.name} - $${c.price}`);
  }
  return created;
}

// NO HAY PREVENTAS PARA JUVECONF 2025
// async function seedPreSales(eventId: string, combos: any[]) {
//   const year = new Date().getFullYear();
//
//   // Preventa 1: Mayo-Junio
//   const p1 = await prisma.preSale.upsert({
//     where: { eventId_name: { eventId, name: 'Preventa Mayo-Junio' } },
//     update: {},
//     create: {
//       eventId,
//       name: 'Preventa Mayo-Junio',
//       description: 'Preventa especial con descuentos',
//       startDate: new Date(`${year}-05-01`),
//       endDate: new Date(`${year}-06-30`),
//       isActive: true,
//     },
//   });
//
//   const prices1 = [16000, 45000, 58000, 72000, 96000];
//   for (let i = 0; i < combos.length; i++) {
//     await prisma.preSaleComboPrice.upsert({
//       where: { preSaleId_comboId: { preSaleId: p1.id, comboId: combos[i].id } },
//       update: {},
//       create: { preSaleId: p1.id, comboId: combos[i].id, price: prices1[i] },
//     });
//   }
//   console.log(`✅ Preventa: ${p1.name} (${prices1.length} precios)`);
//
//   // Preventa 2: Julio+
//   const p2 = await prisma.preSale.upsert({
//     where: { eventId_name: { eventId, name: 'Julio en adelante' } },
//     update: {},
//     create: {
//       eventId,
//       name: 'Julio en adelante',
//       description: 'Preventa regular',
//       startDate: new Date(`${year}-07-01`),
//       endDate: new Date(`${year}-10-15`),
//       isActive: true,
//     },
//   });
//
//   const prices2 = [18000, 50000, 65000, 82000, 108000];
//   for (let i = 0; i < combos.length; i++) {
//     await prisma.preSaleComboPrice.upsert({
//       where: { preSaleId_comboId: { preSaleId: p2.id, comboId: combos[i].id } },
//       update: {},
//       create: { preSaleId: p2.id, comboId: combos[i].id, price: prices2[i] },
//     });
//   }
//   console.log(`✅ Preventa: ${p2.name} (${prices2.length} precios)`);
// }

async function main() {
  console.log('🚀 Iniciando seed de JuveConf 2025...\n');
  try {
    await seedUsers();
    const eventId = await seedEvent();
    await seedCombos(eventId);
    // No hay preventas para JuveConf 2025
    console.log('\n🎉 Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
