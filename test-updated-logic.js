const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Simular la función extractAttendeeInfoFromOrderToken actualizada
function extractAttendeeInfoFromOrderToken(order, inviteeCuil, inviteeName) {
  if (!order?.metadataToken) return null;

  try {
    const secret = process.env.MP_WEBHOOK_SECRET || 'juveconf-metadata-secret-key-2025';
    const decoded = jwt.verify(order.metadataToken, secret);
    
    if (!decoded.attendees) return null;
    
    // Estrategia 1: Buscar por CUIL exacto
    let attendee = decoded.attendees.find(att => att.cuil === inviteeCuil);
    console.log(`   🔍 Búsqueda por CUIL (${inviteeCuil}): ${attendee ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    
    // Estrategia 2: Si no se encuentra por CUIL, buscar por nombre
    if (!attendee) {
      attendee = decoded.attendees.find(att => 
        att.name?.trim().toLowerCase() === inviteeName?.trim().toLowerCase()
      );
      console.log(`   🔍 Búsqueda por nombre (${inviteeName}): ${attendee ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
    }
    
    // Estrategia 3: Si solo hay un attendee, usar ese
    if (!attendee && decoded.attendees.length === 1) {
      attendee = decoded.attendees[0];
      console.log(`   🔍 Único attendee disponible: USANDO`);
    }
    
    if (attendee?.metadata) {
      try {
        return JSON.parse(attendee.metadata);
      } catch (error) {
        console.warn('Error parsing attendee metadata from token:', error);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error decoding order metadata token:', error);
    return null;
  }
}

async function testUpdatedLogic() {
  const prisma = new PrismaClient();

  try {
    // Buscar Miguel Ángel López que tiene PLUS combo
    const inviteeId = '0b465414-2816-49da-b379-21e6a5f0a983';
    
    const invitee = await prisma.invitee.findUnique({
      where: { id: inviteeId },
      include: {
        Order: true,
        Payment: {
          include: {
            Order: true
          }
        }
      }
    });

    console.log(`📋 Invitado: ${invitee.name}`);
    console.log(`   CUIL: ${invitee.cuil}`);
    
    const orderForToken = invitee.Order || invitee.Payment?.Order;
    
    if (orderForToken) {
      console.log('\n🔄 Probando estrategias de búsqueda...');
      
      const attendeeInfo = extractAttendeeInfoFromOrderToken(
        orderForToken, 
        invitee.cuil, 
        invitee.name
      );
      
      if (attendeeInfo) {
        console.log('\n✅ AttendeeInfo encontrada:');
        console.log(JSON.stringify(attendeeInfo, null, 2));
        
        if (attendeeInfo.merchandiseSizes) {
          console.log('\n👕 Merchandise sizes:');
          Object.entries(attendeeInfo.merchandiseSizes).forEach(([type, size]) => {
            console.log(`   ${type}: ${size}`);
          });
        }
      } else {
        console.log('\n❌ No se pudo obtener attendeeInfo');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdatedLogic();