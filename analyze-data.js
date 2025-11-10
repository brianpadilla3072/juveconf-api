const { PrismaClient } = require('@prisma/client');

async function analyzeData() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Analizando datos de la base de datos...\n');

    // Análisis de órdenes
    console.log('📋 ANÁLISIS DE ÓRDENES:');
    const totalOrders = await prisma.order.count();
    console.log(`Total de órdenes: ${totalOrders}`);

    if (totalOrders > 0) {
      const ordersByStatus = await prisma.order.groupBy({
        by: ['status'],
        _count: true
      });
      console.log('Órdenes por estado:');
      ordersByStatus.forEach(status => {
        console.log(`  - ${status.status}: ${status._count}`);
      });

      const ordersByPaymentType = await prisma.order.groupBy({
        by: ['paymentType'],
        _count: true
      });
      console.log('Órdenes por tipo de pago:');
      ordersByPaymentType.forEach(type => {
        console.log(`  - ${type.paymentType}: ${type._count}`);
      });
    }

    // Análisis de pagos
    console.log('\n💰 ANÁLISIS DE PAGOS:');
    const totalPayments = await prisma.payment.count();
    console.log(`Total de pagos: ${totalPayments}`);

    if (totalPayments > 0) {
      const paymentsByType = await prisma.payment.groupBy({
        by: ['type'],
        _count: true,
        _sum: {
          amount: true
        }
      });
      console.log('Pagos por tipo:');
      paymentsByType.forEach(type => {
        console.log(`  - ${type.type}: ${type._count} pagos, $${type._sum.amount || 0} total`);
      });
    }

    // Análisis de eventos
    console.log('\n📅 ANÁLISIS DE EVENTOS:');
    const totalEvents = await prisma.event.count();
    console.log(`Total de eventos: ${totalEvents}`);

    if (totalEvents > 0) {
      const events = await prisma.event.findMany({
        select: {
          id: true,
          year: true,
          topic: true,
          capacity: true,
          isActive: true,
          _count: {
            select: {
              Order: true,
              Combo: true
            }
          }
        }
      });
      console.table(events);
    }

    // Análisis de combos
    console.log('\n🎁 ANÁLISIS DE COMBOS:');
    const totalCombos = await prisma.combo.count();
    console.log(`Total de combos: ${totalCombos}`);

    if (totalCombos > 0) {
      const activeCombos = await prisma.combo.count({
        where: { isActive: true }
      });
      const publishedCombos = await prisma.combo.count({
        where: { isPublished: true }
      });
      console.log(`Combos activos: ${activeCombos}`);
      console.log(`Combos publicados: ${publishedCombos}`);
    }

    // Análisis de invitados
    console.log('\n👥 ANÁLISIS DE INVITADOS:');
    const totalInvitees = await prisma.invitee.count();
    console.log(`Total de invitados: ${totalInvitees}`);

    // Análisis de finanzas
    console.log('\n💵 ANÁLISIS DE FINANZAS:');
    const totalIngresos = await prisma.ingreso.count();
    const totalEgresos = await prisma.egreso.count();
    console.log(`Total de ingresos: ${totalIngresos}`);
    console.log(`Total de egresos: ${totalEgresos}`);

    if (totalIngresos > 0) {
      const sumIngresos = await prisma.ingreso.aggregate({
        _sum: {
          monto: true
        }
      });
      console.log(`Suma total de ingresos: $${sumIngresos._sum.monto || 0}`);
    }

    if (totalEgresos > 0) {
      const sumEgresos = await prisma.egreso.aggregate({
        _sum: {
          monto: true
        }
      });
      console.log(`Suma total de egresos: $${sumEgresos._sum.monto || 0}`);
    }

    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error analizando datos:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeData();