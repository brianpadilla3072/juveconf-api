const { PrismaClient } = require('@prisma/client');

async function testMetadata() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Buscando invitados con metadata...\n');

    // Buscar invitados con metadata
    const invitees = await prisma.invitee.findMany({
      where: {
        deletedAt: null,
        metadata: { not: null }
      },
      take: 2,
      include: {
        Order: {
          include: {
            Combo: true
          }
        },
        Payment: true
      }
    });

    for (const invitee of invitees) {
      console.log(`📋 Invitado: ${invitee.name}`);
      console.log(`   ID: ${invitee.id}`);
      console.log(`   Metadata raw: ${invitee.metadata}`);
      
      try {
        const parsed = JSON.parse(invitee.metadata);
        console.log('   📦 Metadata parseada:');
        console.log(`      Email: ${parsed.email || 'No disponible'}`);
        console.log(`      Phone: ${parsed.phone || 'No disponible'}`);
        console.log(`      City: ${parsed.city || 'No disponible'}`);
        console.log(`      Church: ${parsed.church || 'No disponible'}`);
        console.log(`      Birthdate: ${parsed.birthdate || 'No disponible'}`);
        
        if (parsed.merchandiseSizes) {
          console.log('   👕 Merchandise Sizes:');
          Object.entries(parsed.merchandiseSizes).forEach(([type, size]) => {
            console.log(`      ${type}: ${size}`);
          });
        } else {
          console.log('   👕 Merchandise Sizes: No disponible');
        }
      } catch (error) {
        console.log('   ❌ Error parsing metadata:', error.message);
      }
      
      if (invitee.Order?.Combo) {
        console.log(`   🎁 Combo: ${invitee.Order.Combo.name}`);
      }
      
      console.log('   ---\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMetadata();