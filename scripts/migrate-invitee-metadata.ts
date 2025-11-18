import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AttendeeMetadata {
  email?: string;
  phone?: string;
  birthdate?: string;
  city?: string;
  church?: string;
  merchandiseSizes?: Record<string, string>;
}

interface AttendeeInfo {
  name: string;
  cuil: string;
  metadata: AttendeeMetadata;
}

interface DecodedToken {
  attendees: AttendeeInfo[];
  [key: string]: any;
}

async function migrateInviteeMetadata() {
  console.log('🔄 Iniciando migración de metadata de invitees...\n');

  // 1. Encontrar todos los invitees (vamos a actualizar su metadata)
  const invitees = await prisma.invitee.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      Order: {
        select: {
          id: true,
          metadataToken: true,
        },
      },
    },
  });

  console.log(`📊 Se encontraron ${invitees.length} invitees para procesar`);

  if (invitees.length === 0) {
    console.log('✅ No hay invitees para migrar');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const invitee of invitees) {
    try {
      // Verificar que tenga orden y token
      if (!invitee.Order?.metadataToken) {
        console.log(`⚠️  Invitee ${invitee.id} (${invitee.name}) no tiene metadataToken, saltando...`);
        skippedCount++;
        continue;
      }

      // Decodificar el token
      const decoded = jwt.decode(invitee.Order.metadataToken) as DecodedToken;

      if (!decoded || !decoded.attendees) {
        console.log(`⚠️  No se pudo decodificar token para invitee ${invitee.id}, saltando...`);
        skippedCount++;
        continue;
      }

      // Encontrar los datos del asistente en el token (solo por nombre, ya que CUILs pueden diferir)
      const attendeeInfo = decoded.attendees.find(
        (a) => a.name === invitee.name,
      );

      if (!attendeeInfo || !attendeeInfo.metadata) {
        console.log(`⚠️  No se encontró metadata para ${invitee.name} (${invitee.cuil}), saltando...`);
        skippedCount++;
        continue;
      }

      // El metadata en el token puede ser string o objeto
      let metadata: AttendeeMetadata;
      if (typeof attendeeInfo.metadata === 'string') {
        metadata = JSON.parse(attendeeInfo.metadata);
      } else {
        metadata = attendeeInfo.metadata;
      }

      // Actualizar el invitee con la metadata
      await prisma.invitee.update({
        where: { id: invitee.id },
        data: {
          metadata: JSON.stringify(metadata),
        },
      });

      console.log(`✅ Migrado: ${invitee.name} (${invitee.cuil}) - ${Object.keys(attendeeInfo.metadata).join(', ')}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error migrando invitee ${invitee.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📈 Resumen de migración:');
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ⚠️  Saltados: ${skippedCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📊 Total procesados: ${invitees.length}`);
}

// Ejecutar migración
migrateInviteeMetadata()
  .catch((e) => {
    console.error('❌ Error fatal en migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
