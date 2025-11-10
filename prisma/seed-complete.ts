/* eslint-disable prettier/prettier */
import { UserRole, PrismaClient, OrderStatus, PaymentType, EmailType, EmailStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function generateMetadataToken(payload: any): string {
  const secret = process.env.MP_WEBHOOK_SECRET || 'juveconf-metadata-secret-key-2025';
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

// Datos realistas para testing
const SAMPLE_NAMES = [
  'Juan Carlos Pérez', 'María Elena García', 'Pedro Luis Martínez', 'Ana Sofía Rodríguez',
  'Miguel Ángel López', 'Laura Isabel Fernández', 'Carlos Eduardo Silva', 'Valentina Morales',
  'Santiago Ramírez', 'Camila Andrea Torres', 'Nicolás Vargas', 'Isabella Cruz',
  'Diego Alejandro Ruiz', 'Antonella Díaz', 'Mateo Herrera', 'Florencia Jiménez',
  'Sebastián Castillo', 'Luciana Mendoza', 'Joaquín Ramos', 'Emilia Vega'
];

const SAMPLE_EMAILS = [
  'juan.perez', 'maria.garcia', 'pedro.martinez', 'ana.rodriguez',
  'miguel.lopez', 'laura.fernandez', 'carlos.silva', 'valentina.morales',
  'santiago.ramirez', 'camila.torres', 'nicolas.vargas', 'isabella.cruz',
  'diego.ruiz', 'antonella.diaz', 'mateo.herrera', 'florencia.jimenez',
  'sebastian.castillo', 'luciana.mendoza', 'joaquin.ramos', 'emilia.vega'
];

function generateCUIL(): string {
  // Genera un CUIL válido de prueba
  const prefix = Math.random() > 0.5 ? '20' : '27'; // 20 para hombres, 27 para mujeres
  const dni = Math.floor(Math.random() * 90000000) + 10000000;
  const suffix = Math.floor(Math.random() * 9) + 1;
  return `${prefix}${dni}${suffix}`;
}

function generatePhone(): string {
  const area = Math.random() > 0.5 ? '011' : '291'; // Buenos Aires o Bahía Blanca
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `+54${area}${number}`;
}

async function seedUsers() {
  const users = [
    { email: 'padillabrian@gmail.com', password: 'Nopasaran3072', dni: '42469579', name: 'Brian Padilla', role: UserRole.DEVELOPER },
    { email: 'aldiruiz2024@gmail.com', password: 'aldiruiz20224', dni: '00000003', name: 'Aldana Micaela Ruiz Diaz', role: UserRole.ADMIN },
    { email: 'editor@juveconf.com', password: 'editor123', dni: '33444555', name: 'Editor de Prueba', role: UserRole.EDITOR },
    { email: 'colaborador@juveconf.com', password: 'colab123', dni: '22333444', name: 'Colaborador Test', role: UserRole.COLLABORATOR },
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
        emailVerified: true,
        locale: 'es-AR',
        requirePasswordChange: false
      },
    });
    console.log(`✅ Usuario: ${user.email} (${user.role})`);
  }
}

async function seedEvent() {
  const year = 2025;

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
      salesEndDate: new Date('2025-11-10'),
      eventStartDate: new Date('2025-11-14'),
      eventEndDate: new Date('2025-11-16'),
      location: 'Bahía Blanca, Buenos Aires',
      description: 'Conferencia anual para jóvenes - JuveConf 2025. Un encuentro transformador para la juventud cristiana de Argentina.',
      isActive: true,
      eventDays: {
        viernes: {
          date: '2025-11-14',
          activities: ['Apertura', 'Plenaria 1', 'Talleres', 'Cena comunitaria']
        },
        sabado: {
          date: '2025-11-15', 
          activities: ['Plenaria 2', 'Talleres', 'Deportes', 'Noche de talentos']
        },
        domingo: {
          date: '2025-11-16',
          activities: ['Plenaria 3', 'Plenaria de cierre', 'Despedida']
        }
      }
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
      max: 100,
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
      price: 15000,
      persons: 1,
      max: 300,
      isFree: false,
      desc: 'Ideal para vivir toda la experiencia completa de JUVEConf',
      benefits: [
        'Acceso a las 4 plenarias generales',
        'Participación en todos los talleres',
        'Actividades deportivas',
        'Hospedaje gratuito en casa de hermanos',
        'Kit completo de materiales',
        'Acceso al buffet oficial (comidas no incluidas)'
      ]
    },
    {
      name: 'PLUS',
      price: 35000,
      persons: 1,
      max: 100,
      isFree: false,
      desc: 'Experiencia completa con merchandising oficial',
      benefits: [
        'Todo lo del combo COMPLETO',
        'Remera oficial JuveConf 2025',
        'Materiales premium',
        'Acceso prioritario a actividades'
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

async function seedOrders(eventId: string, combos: any[], userId: string) {
  const orderStates = [OrderStatus.PENDING, OrderStatus.REVIEW, OrderStatus.PAID, OrderStatus.PAID, OrderStatus.PAID]; // Más órdenes pagadas
  const paymentTypes = [PaymentType.TRANSFER, PaymentType.MERCADOPAGO, PaymentType.CASH];
  
  const orders: any[] = [];
  
  for (let i = 0; i < 15; i++) {
    const combo = combos[Math.floor(Math.random() * combos.length)];
    const status = orderStates[Math.floor(Math.random() * orderStates.length)];
    const paymentType = paymentTypes[Math.floor(Math.random() * paymentTypes.length)];
    const email = `${SAMPLE_EMAILS[i % SAMPLE_EMAILS.length]}@example.com`;
    const cuil = generateCUIL();
    const phone = generatePhone();
    const name = SAMPLE_NAMES[i % SAMPLE_NAMES.length];
    
    // Crear metadata payload con estructura correcta
    const metadataPayload = {
      orderId: '', // Se asignará después de crear la orden
      userId: Math.random() > 0.3 ? userId : null,
      eventId,
      comboId: combo.id,
      quantity: 1,
      email,
      phone,
      cuil,
      totalAmount: combo.price,
      currency: 'ARS',
      attendees: [
        {
          name: name,
          cuil: cuil,
          metadata: JSON.stringify({
            email: email,
            phone: phone,
            birthdate: '1990-01-01',
            city: 'Bahía Blanca',
            church: 'Iglesia Ejemplo',
            merchandiseSizes: { remera: 'M' }
          })
        }
      ]
    };
    
    const order = await prisma.order.create({
      data: {
        year: 2025,
        userId: metadataPayload.userId,
        eventId,
        comboId: combo.id,
        total: combo.price,
        status,
        paymentType,
        cuil,
        email,
        phone,
        externalReference: paymentType === PaymentType.MERCADOPAGO ? `MP_${Date.now()}_${i}` : null,
        orderSnapshot: {
          combo: {
            name: combo.name,
            price: combo.price,
            benefits: combo.metadata?.benefits || []
          },
          createdAt: new Date().toISOString()
        }
      }
    });
    
    // Actualizar orderId en payload y generar token
    metadataPayload.orderId = order.id;
    const metadataToken = generateMetadataToken(metadataPayload);
    
    // Actualizar orden con el token
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { metadataToken }
    });
    
    orders.push(updatedOrder);
    console.log(`✅ Orden ${i + 1}: ${status} - ${combo.name} - $${combo.price}`);
  }
  
  return orders;
}

async function seedInvitees(orders: any[], payments: any[]) {
  const invitees: any[] = [];
  
  // Crear un mapa de orderId -> paymentId para vincular correctamente
  const orderToPaymentMap = new Map();
  payments.forEach(payment => {
    orderToPaymentMap.set(payment.orderId, payment.id);
  });
  
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const paymentId = orderToPaymentMap.get(order.id);
    
    // Solo crear invitados para órdenes que tienen pagos (principalmente las pagadas)
    if (paymentId || (order.status === OrderStatus.PAID && Math.random() > 0.7)) {
      const invitee = await prisma.invitee.create({
        data: {
          name: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
          cuil: generateCUIL(),
          email: `${SAMPLE_EMAILS[i % SAMPLE_EMAILS.length]}@example.com`,
          phone: generatePhone(),
          orderId: order.id,
          paymentId: paymentId || null, // Vincular al pago si existe
          attendance: {
            viernes: Math.random() > 0.3 ? { present: true, time: '09:00' } : null,
            sabado: Math.random() > 0.2 ? { present: true, time: '08:30' } : null,
            domingo: Math.random() > 0.4 ? { present: true, time: '09:15' } : null
          },
          metadata: JSON.stringify({
            allergies: Math.random() > 0.8 ? ['gluten'] : [],
            specialRequests: Math.random() > 0.9 ? 'Dieta vegetariana' : null,
            emergencyContact: generatePhone()
          })
        }
      });
      
      invitees.push(invitee);
      console.log(`✅ Invitado: ${invitee.name}${paymentId ? ' (vinculado a pago)' : ''}`);
    }
  }
  
  return invitees;
}

async function seedPayments(orders: any[], userId: string) {
  const payments: any[] = [];
  
  for (const order of orders) {
    if (order.status === OrderStatus.PAID || order.status === OrderStatus.REVIEW) {
      const payment = await prisma.payment.create({
        data: {
          year: 2025,
          orderId: order.id,
          amount: order.total,
          type: order.paymentType,
          userId: Math.random() > 0.5 ? userId : null,
          payerName: SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)],
          payerEmail: order.email,
          payerDni: order.cuil.substring(2, 10), // Extraer DNI del CUIL
          payerPhone: order.phone,
          externalReference: order.paymentType === PaymentType.MERCADOPAGO ? `PAY_${Date.now()}_${order.id}` : null,
        }
      });
      
      payments.push(payment);
      console.log(`✅ Pago: $${payment.amount} - ${payment.type}`);
    }
  }
  
  return payments;
}

async function seedFinanzas() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  
  // Ingresos
  const ingresos = [
    { concepto: 'Venta de combos - Enero', monto: 150000, metodoPago: 'Transferencia' },
    { concepto: 'Venta de combos - Febrero', monto: 89000, metodoPago: 'MercadoPago' },
    { concepto: 'Donación iglesia local', monto: 50000, metodoPago: 'Efectivo' },
    { concepto: 'Venta de combos - Marzo', monto: 234000, metodoPago: 'Transferencia' },
    { concepto: 'Sponsorship empresa local', monto: 100000, metodoPago: 'Transferencia' },
  ];
  
  for (const ingreso of ingresos) {
    await prisma.ingreso.create({
      data: {
        fecha: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        concepto: ingreso.concepto,
        monto: ingreso.monto,
        metodoPago: ingreso.metodoPago,
        year,
        notas: `Ingreso registrado automáticamente - ${ingreso.concepto}`
      }
    });
  }
  
  // Egresos
  const egresos = [
    { concepto: 'Alquiler de sonido', monto: 75000, metodoPago: 'Transferencia' },
    { concepto: 'Material para talleres', monto: 25000, metodoPago: 'Efectivo' },
    { concepto: 'Transporte de oradores', monto: 45000, metodoPago: 'Transferencia' },
    { concepto: 'Impresión de materiales', monto: 18000, metodoPago: 'Tarjeta' },
    { concepto: 'Decoración del evento', monto: 32000, metodoPago: 'Efectivo' },
  ];
  
  for (const egreso of egresos) {
    await prisma.egreso.create({
      data: {
        fecha: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        concepto: egreso.concepto,
        monto: egreso.monto,
        metodoPago: egreso.metodoPago,
        year,
        notas: `Egreso registrado automáticamente - ${egreso.concepto}`
      }
    });
  }
  
  console.log(`✅ Finanzas: ${ingresos.length} ingresos y ${egresos.length} egresos`);
}

async function seedEmailQueue(orders: any[], payments: any[]) {
  const emailTypes = [EmailType.ORDEN_TRANSFER, EmailType.ORDEN_CASH, EmailType.TICKET_DOWNLOAD];
  const emailStatuses = [EmailStatus.SENT, EmailStatus.PENDING, EmailStatus.FAILED];
  
  for (let i = 0; i < 10; i++) {
    const order = orders[i % orders.length];
    const payment = payments[i % payments.length] || null;
    const emailType = emailTypes[Math.floor(Math.random() * emailTypes.length)];
    const status = emailStatuses[Math.floor(Math.random() * emailStatuses.length)];
    
    await prisma.emailQueue.create({
      data: {
        to: order.email,
        subject: `JuveConf 2025 - ${emailType.replace('_', ' ')}`,
        template: emailType,
        emailType,
        orderId: order.id,
        paymentId: payment?.id || null,
        status,
        attempts: status === EmailStatus.FAILED ? Math.floor(Math.random() * 3) + 1 : 1,
        sentAt: status === EmailStatus.SENT ? new Date() : null,
        lastAttemptAt: new Date(),
        errorMessage: status === EmailStatus.FAILED ? 'SMTP connection timeout' : null,
        context: {
          orderNumber: order.id.substring(0, 8),
          userName: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
          eventName: 'JuveConf 2025'
        }
      }
    });
  }
  
  console.log(`✅ Cola de emails: 10 emails creados`);
}

async function main() {
  console.log('🚀 Iniciando seed completo de JuveConf 2025...\n');
  
  try {
    // 1. Usuarios
    await seedUsers();
    console.log('');
    
    // 2. Evento
    const eventId = await seedEvent();
    console.log('');
    
    // 3. Combos
    const combos = await seedCombos(eventId);
    console.log('');
    
    // 4. Obtener usuario para asignar órdenes
    const developer = await prisma.user.findFirst({
      where: { email: 'padillabrian@gmail.com' }
    });
    
    if (!developer) {
      throw new Error('Usuario developer no encontrado');
    }
    
    // 5. Órdenes
    const orders = await seedOrders(eventId, combos, developer.id);
    console.log('');
    
    // 6. Pagos (antes que invitados para poder vincularlos)
    const payments = await seedPayments(orders, developer.id);
    console.log('');
    
    // 7. Invitados (vinculados a pagos)
    await seedInvitees(orders, payments);
    console.log('');
    
    // 8. Finanzas
    await seedFinanzas();
    console.log('');
    
    // 9. Cola de emails
    await seedEmailQueue(orders, payments);
    console.log('');
    
    console.log('🎉 Seed completo exitoso!');
    console.log('');
    console.log('📊 Resumen de datos creados:');
    console.log(`   - ${orders.length} órdenes`);
    console.log(`   - ${payments.length} pagos`);
    console.log(`   - ${combos.length} combos`);
    console.log('   - Datos financieros completos');
    console.log('   - Cola de emails de ejemplo');
    console.log('');
    console.log('🔐 Credenciales de acceso:');
    console.log('   Developer: padillabrian@gmail.com / Nopasaran3072');
    console.log('   Admin: aldiruiz2024@gmail.com / aldiruiz20224');
    console.log('   Editor: editor@juveconf.com / editor123');
    console.log('   Colaborador: colaborador@juveconf.com / colab123');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);