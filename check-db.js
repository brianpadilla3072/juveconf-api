const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
  });

  try {
    // Check triggers
    console.log('Checking triggers...');
    const triggers = await prisma.$queryRaw`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'Order';
    `;
    console.log('Triggers:', JSON.stringify(triggers, null, 2));

    // Check views
    console.log('\nChecking views...');
    const views = await prisma.$queryRaw`
      SELECT table_name, view_definition 
      FROM information_schema.views 
      WHERE table_schema = 'public';
    `;
    console.log('Views:', JSON.stringify(views, null, 2));

    // Check table structure
    console.log('\nChecking Order table structure...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Order';
    `;
    console.log('Order table columns:', JSON.stringify(columns, null, 2));

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
