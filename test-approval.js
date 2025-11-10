const { PrismaClient } = require('@prisma/client');

async function testApproval() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Buscando una orden en estado REVIEW para aprobar...\n');

    // Buscar una orden en REVIEW
    const reviewOrder = await prisma.order.findFirst({
      where: { 
        status: 'REVIEW',
        metadataToken: { not: null }
      },
      include: {
        Invitee: true,
        Payment: true
      }
    });

    if (!reviewOrder) {
      console.log('❌ No se encontró ninguna orden en estado REVIEW');
      return;
    }

    console.log('📋 Orden encontrada:');
    console.log(`   ID: ${reviewOrder.id}`);
    console.log(`   Email: ${reviewOrder.email}`);
    console.log(`   CUIL: ${reviewOrder.cuil}`);
    console.log(`   Estado: ${reviewOrder.status}`);
    console.log(`   Total: $${reviewOrder.total}`);
    console.log(`   Invitados actuales: ${reviewOrder.Invitee.length}`);
    console.log(`   Pagos actuales: ${reviewOrder.Payment.length}`);
    console.log(`   MetadataToken: ${reviewOrder.metadataToken ? 'PRESENTE' : 'AUSENTE'}`);

    console.log('\n✅ Esta orden está lista para ser aprobada usando:');
    console.log(`PUT http://localhost:3072/orders/${reviewOrder.id}/approve`);
    console.log('\n📝 Después de aprobar, debería:');
    console.log('   - Cambiar estado a PAID');
    console.log('   - Crear un Payment');
    console.log('   - Crear Invitados automáticamente desde el metadataToken');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApproval();