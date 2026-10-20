/* eslint-disable prettier/prettier */
import { ConflictException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';

/**
 * Las inscripciones de equipos se cobran ANTES de crear el equipo: el registro publico crea una
 * orden de transferencia y el equipo recien nace cuando un admin aprueba el pago.
 *
 * Para no inventar tablas nuevas, la orden guarda todo lo necesario en `orderSnapshot.team` y usa
 * un combo "sistema" por evento (asi `Order.comboId` sigue siendo obligatorio y el panel de ordenes
 * muestra un nombre claro). Al aprobar, OrdersService lee el snapshot y crea el equipo.
 */

/** Nombre del combo interno que agrupa las ordenes de equipos de un evento. */
export const TEAM_COMBO_NAME = 'Inscripción de equipos';

export interface TeamOrderPlayer {
  firstName: string;
  lastName: string;
}

/** Datos que viajan dentro de Order.orderSnapshot.team. */
export interface TeamOrderSnapshot {
  kind: 'team';
  teamTypeId: string;
  teamTypeName: string;
  name: string;
  leaderName: string | null;
  leaderPhone: string | null;
  leaderEmail: string | null;
  players: TeamOrderPlayer[];
  timestamp: string;
}

export function buildTeamOrderSnapshot(
  payload: Omit<TeamOrderSnapshot, 'kind' | 'timestamp'>,
): TeamOrderSnapshot {
  return { kind: 'team', ...payload, timestamp: new Date().toISOString() };
}

/** Lee (y valida) el snapshot de equipo de una orden; null si no es una orden de equipo. */
export function readTeamOrderSnapshot(orderSnapshot: unknown): TeamOrderSnapshot | null {
  const team = (orderSnapshot as { team?: Partial<TeamOrderSnapshot> } | null)?.team;
  if (!team || team.kind !== 'team' || !team.teamTypeId || !team.name || !Array.isArray(team.players)) {
    return null;
  }
  return team as TeamOrderSnapshot;
}

/** Combo "sistema" del evento: las ordenes de equipos necesitan un comboId (FK). No se publica ni se activa. */
export async function getOrCreateTeamCombo(
  tx: Prisma.TransactionClient,
  eventId: string,
): Promise<{ id: string }> {
  const existing = await tx.combo.findFirst({
    where: { eventId, name: TEAM_COMBO_NAME },
  });
  if (existing) return existing;

  try {
    return await tx.combo.create({
      data: {
        eventId,
        name: TEAM_COMBO_NAME,
        description: 'Combo interno para agrupar las ordenes de inscripcion de equipos.',
        price: 0,
        personsIncluded: 1,
        isFree: true,
        isActive: false,
        isPublished: false,
        mealsEnabled: false,
      },
    });
  } catch (e) {
    // Otra orden lo creo en paralelo: lo reutilizamos
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const combo = await tx.combo.findFirst({ where: { eventId, name: TEAM_COMBO_NAME } });
      if (combo) return combo;
    }
    throw e;
  }
}

/**
 * Cupos ocupados del tipo: equipos ya creados + ordenes de equipo sin resolver
 * (pendientes/en revision). Asi no se venden mas cupos de los que entran.
 */
export async function countReservedTeams(
  tx: Prisma.TransactionClient,
  teamTypeId: string,
  teamComboId: string,
): Promise<number> {
  const [teams, orders] = await Promise.all([
    tx.team.count({ where: { teamTypeId, deletedAt: null } }),
    tx.order.count({
      where: {
        comboId: teamComboId,
        status: { in: [OrderStatus.PENDING, OrderStatus.REVIEW] },
        orderSnapshot: { path: ['team', 'teamTypeId'], equals: teamTypeId },
      },
    }),
  ]);
  return teams + orders;
}

/** Orden de equipo (sin resolver) que ya reservo ese nombre en la categoria, si existe. */
export async function findPendingTeamOrderByName(
  tx: Prisma.TransactionClient,
  teamComboId: string,
  teamTypeId: string,
  name: string,
): Promise<boolean> {
  const clash = await tx.order.findFirst({
    where: {
      comboId: teamComboId,
      status: { in: [OrderStatus.PENDING, OrderStatus.REVIEW] },
      AND: [
        { orderSnapshot: { path: ['team', 'teamTypeId'], equals: teamTypeId } },
        { orderSnapshot: { path: ['team', 'name'], equals: name } },
      ],
    },
    select: { id: true },
  });
  return Boolean(clash);
}

/**
 * Crea el equipo (con sus participantes) a partir del snapshot de una orden aprobada.
 * Si el nombre ya esta tomado le agrega un numero: la aprobacion nunca debe fallar.
 */
export async function createTeamFromSnapshot(tx: Prisma.TransactionClient, snap: TeamOrderSnapshot) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const name = attempt === 0 ? snap.name : `${snap.name} (${attempt + 1})`;
    const taken = await tx.team.findFirst({ where: { teamTypeId: snap.teamTypeId, name }, select: { id: true } });
    if (taken) continue;

    return tx.team.create({
      data: {
        teamTypeId: snap.teamTypeId,
        name,
        leaderName: snap.leaderName,
        leaderPhone: snap.leaderPhone,
        leaderEmail: snap.leaderEmail,
        TeamPlayer: {
          create: snap.players.map((p) => ({ firstName: p.firstName, lastName: p.lastName })),
        },
      },
      include: { TeamType: true, TeamPlayer: true },
    });
  }
  throw new ConflictException('No pudimos asignar un nombre libre al equipo');
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Email (HTML) al lider cuando su equipo quedo inscripto, con el link privado para editarlo.
 * Se manda como HTML crudo para no depender del pipeline de plantillas Handlebars.
 */
export function teamConfirmedHtml(params: {
  teamName: string;
  teamTypeName: string;
  players: { firstName: string; lastName: string }[];
  editUrl: string;
}): string {
  const players = params.players
    .map(
      (p, i) =>
        `<li style="margin:6px 0;color:#e0e0e0;font-size:15px;">${i + 1}. ${escapeHtml(p.firstName)} ${escapeHtml(
          p.lastName,
        )}</li>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Equipo inscripto</title></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#141414;border-radius:16px;overflow:hidden;border:1px solid #262626;">
        <tr><td style="padding:32px;text-align:center;background:linear-gradient(135deg,#8B3FFF 0%,#6B2FDF 100%);">
          <div style="color:#CCFF00;font-weight:900;font-size:18px;letter-spacing:1.5px;">JUVECONFE</div>
          <h1 style="color:#ffffff;margin:12px 0 0;font-size:26px;font-weight:800;">¡Tu equipo quedó inscripto! 🏆</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#b0b0b0;font-size:16px;line-height:1.6;margin:0 0 20px;">
            Confirmamos el pago de <strong style="color:#8B3FFF;">${escapeHtml(params.teamName)}</strong>
            (${escapeHtml(params.teamTypeName)}). Ya está inscripto en la competencia.
          </p>
          <div style="background:#0f0f0f;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="margin:0 0 10px;font-size:13px;color:#9a9a9a;text-transform:uppercase;letter-spacing:1px;">Participantes</p>
            <ol style="margin:0;padding-left:20px;">${players}</ol>
          </div>
          <div style="background:linear-gradient(135deg,rgba(139,63,255,.15),rgba(139,63,255,.05));border:2px solid #8B3FFF;border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0 0 10px;color:#CCFF00;font-weight:700;">Guardá este link</p>
            <p style="margin:0 0 16px;color:#b0b0b0;font-size:14px;line-height:1.6;">
              Con este link privado podés corregir el nombre del equipo o los participantes. Quien lo tenga puede editar el equipo.
            </p>
            <a href="${escapeHtml(params.editUrl)}" style="display:inline-block;background:#8B3FFF;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;">Editar mi equipo</a>
            <p style="margin:16px 0 0;color:#6f6f6f;font-size:12px;word-break:break-all;">${escapeHtml(params.editUrl)}</p>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #262626;">
          <p style="margin:0;color:#6f6f6f;font-size:12px;">Juventud en Conferencia · administracion@vidaeternaiglesia.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
