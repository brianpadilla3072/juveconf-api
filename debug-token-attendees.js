const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function debugTokenAttendees() {
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
    
    if (orderForToken?.metadataToken) {
      try {
        const secret = process.env.MP_WEBHOOK_SECRET || 'juveconf-metadata-secret-key-2025';
        const decoded = jwt.verify(orderForToken.metadataToken, secret);
        
        console.log('\n🔐 Contenido completo del token:');
        console.log(JSON.stringify(decoded, null, 2));
        
        console.log('\n👥 Attendees en el token:');
        if (decoded.attendees) {
          decoded.attendees.forEach((attendee, index) => {
            console.log(`   [${index + 1}] Nombre: ${attendee.name}`);
            console.log(`       CUIL: ${attendee.cuil}`);
            console.log(`       Metadata: ${attendee.metadata || 'No disponible'}`);
            
            if (attendee.metadata) {
              try {
                const parsed = JSON.parse(attendee.metadata);
                if (parsed.merchandiseSizes) {
                  console.log(`       👕 Merchandise: ${JSON.stringify(parsed.merchandiseSizes)}`);
                }
              } catch (e) {
                console.log(`       ❌ Error parsing metadata: ${e.message}`);
              }
            }
            console.log('');
          });
        } else {
          console.log('   ❌ No hay attendees en el token');
        }
        
      } catch (error) {
        console.warn('❌ Error decoding token:', error.message);
      }
    } else {
      console.log('❌ No hay metadataToken');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugTokenAttendees();