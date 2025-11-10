const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function testOrderMetadata() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Buscando ordenes con metadata tokens...\n');

    // Buscar órdenes con metadataToken
    const orders = await prisma.order.findMany({
      where: {
        metadataToken: { not: null }
      },
      take: 3,
      include: {
        Combo: true,
        Invitee: true
      }
    });

    for (const order of orders) {
      console.log(`📦 Order: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Combo: ${order.Combo?.name || 'No combo'}`);
      console.log(`   Invitados asociados: ${order.Invitee?.length || 0}`);
      
      if (order.Invitee?.length > 0) {
        order.Invitee.forEach(inv => {
          console.log(`      - ${inv.name}`);
        });
      }
      
      if (order.metadataToken) {
        try {
          const secret = process.env.MP_WEBHOOK_SECRET || 'juveconf-metadata-secret-key-2025';
          const decoded = jwt.verify(order.metadataToken, secret);
          
          console.log('   🔐 Metadata Token Decoded:');
          console.log(JSON.stringify(decoded, null, 4));
          
          if (decoded.attendees) {
            console.log('   👥 Attendees:');
            decoded.attendees.forEach((attendee, index) => {
              console.log(`      [${index + 1}] ${attendee.name}`);
              if (attendee.merchandiseSizes) {
                console.log(`         👕 Merchandise: ${JSON.stringify(attendee.merchandiseSizes)}`);
              }
            });
          }
          
        } catch (error) {
          console.log('   ❌ Error decoding token:', error.message);
        }
      }
      
      console.log('   ---\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderMetadata();