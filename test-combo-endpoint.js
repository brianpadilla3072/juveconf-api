const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

async function testComboEndpoint() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Buscando un invitado para probar el endpoint...\n');

    // Buscar un invitado que tenga orden o payment
    const invitee = await prisma.invitee.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { orderId: { not: null } },
          { paymentId: { not: null } }
        ]
      },
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
      console.log('❌ No se encontró ningún invitado para probar');
      return;
    }

    console.log('📋 Invitado encontrado:');
    console.log(`   ID: ${invitee.id}`);
    console.log(`   Nombre: ${invitee.name}`);
    console.log(`   Tiene Order: ${invitee.Order ? 'SÍ' : 'NO'}`);
    console.log(`   Tiene Payment: ${invitee.Payment ? 'SÍ' : 'NO'}`);
    
    if (invitee.Order?.Combo) {
      console.log(`   Combo (vía Order): ${invitee.Order.Combo.name}`);
    } else if (invitee.Payment?.Order?.Combo) {
      console.log(`   Combo (vía Payment): ${invitee.Payment.Order.Combo.name}`);
    }

    console.log(`\n🚀 Probando endpoint: GET /invitees/${invitee.id}/combo-info`);
    console.log('\nEste endpoint debería retornar información completa del combo.');
    console.log('Puedes probarlo manualmente con:');
    console.log(`curl -X GET "http://localhost:3072/invitees/${invitee.id}/combo-info" -H "Authorization: Bearer <tu-token>"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testComboEndpoint();