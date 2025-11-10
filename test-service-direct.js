const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function testServiceDirect() {
  const prisma = new PrismaClient();

  try {
    // Buscar Miguel Ángel López que tiene PLUS combo
    const inviteeId = '0b465414-2816-49da-b379-21e6a5f0a983';
    
    console.log('🔍 Probando lógica del servicio directamente...\n');
    
    // Simular la lógica del servicio getComboInfoForInvitee
    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      include: {
        Order: {
          include: {
            Combo: true
          }
        },
        Payment: {
          include: {
            Order: {
              include: {
                Combo: true
              }
            }
          }
        }
      }
    });

    if (!invitee) {
      console.log('❌ Invitee not found');
      return;
    }

    console.log(`📋 Invitado: ${invitee.name}`);
    console.log(`   CUIL: ${invitee.cuil}`);
    
    let combo = null;
    let orderForToken = null;

    // Estrategia 1: Order directa
    if (invitee.Order?.Combo) {
      combo = invitee.Order.Combo;
      orderForToken = invitee.Order;
      console.log('   📦 Combo encontrado vía Order directa');
    }
    // Estrategia 2: Payment->Order
    else if (invitee.Payment?.Order?.Combo) {
      combo = invitee.Payment.Order.Combo;
      orderForToken = invitee.Payment.Order;
      console.log('   📦 Combo encontrado vía Payment->Order');
    }

    if (!combo) {
      console.log('   ❌ No se encontró combo');
      return;
    }

    console.log(`   🎁 Combo: ${combo.name}`);

    // Extraer merchandise del combo
    let merchandise = null;
    try {
      if (combo.metadata && typeof combo.metadata === 'object') {
        merchandise = combo.metadata.merchandise || null;
      }
    } catch (error) {
      console.warn('Error parsing combo metadata:', error);
    }

    console.log(`   👕 Merchandise enabled: ${merchandise?.enabled || false}`);

    // Extraer información del attendee desde el metadata token
    let attendeeInfo = null;
    if (orderForToken?.metadataToken) {
      try {
        const secret = process.env.MP_WEBHOOK_SECRET || 'juveconf-metadata-secret-key-2025';
        const decoded = jwt.verify(orderForToken.metadataToken, secret);
        
        console.log('   🔐 Token decodificado exitosamente');
        
        // Buscar el attendee por CUIL
        const attendee = decoded.attendees?.find(att => att.cuil === invitee.cuil);
        
        if (attendee?.metadata) {
          attendeeInfo = JSON.parse(attendee.metadata);
          console.log('   👤 AttendeeInfo extraída del token:');
          console.log('      ', JSON.stringify(attendeeInfo, null, 6));
          
          if (attendeeInfo.merchandiseSizes) {
            console.log('   👕 Merchandise sizes encontradas:');
            Object.entries(attendeeInfo.merchandiseSizes).forEach(([type, size]) => {
              console.log(`      ${type}: ${size}`);
            });
          }
        } else {
          console.log('   ❌ No se encontró attendee o metadata en el token');
        }
      } catch (error) {
        console.warn('   ❌ Error decoding token:', error.message);
      }
    } else {
      console.log('   ❌ No hay metadataToken en la orden');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceDirect();