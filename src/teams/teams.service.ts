/* eslint-disable prettier/prettier */
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTeamDto, CreateTeamTypeDto, PlayerDto, UpdateTeamDto, UpdateTeamTypeDto } from './dto/teams.dto';
import { assertPlayers, cleanText, normalizePlayers } from './teams-rules';

const PLAYER_SELECT = { id: true, firstName: true, lastName: true } as const;

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------- publico

  /** Tipos activos y publicados del evento, con cupo restante */
  async listPublicTypes(eventId: string) {
    const types = await this.prisma.teamType.findMany({
      where: { eventId, isActive: true, isPublished: true, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { Team: { where: { deletedAt: null } } } } },
    });
    return types.map((t) => this.toPublicType(t));
  }

  async createTeam(dto: CreateTeamDto) {
    const players = normalizePlayers(dto.players);
    const name = cleanText(dto.name);

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Bloquea el tipo para que dos inscripciones simultaneas no superen maxTeams
        await tx.$queryRaw`SELECT id FROM "TeamType" WHERE id = ${dto.teamTypeId} FOR UPDATE`;
        const type = await tx.teamType.findFirst({ where: { id: dto.teamTypeId, deletedAt: null } });
        if (!type || !type.isActive || !type.isPublished) {
          throw new NotFoundException('Ese tipo de equipo no esta disponible');
        }
        assertPlayers(type, players);
        if (type.maxTeams !== null) {
          const taken = await tx.team.count({ where: { teamTypeId: type.id, deletedAt: null } });
          if (taken >= type.maxTeams) {
            throw new ConflictException(`Ya no quedan cupos para "${type.name}"`);
          }
        }
        const team = await tx.team.create({
          data: {
            teamTypeId: type.id,
            name,
            leaderName: cleanText(dto.leaderName),
            leaderPhone: cleanText(dto.leaderPhone),
            leaderEmail: dto.leaderEmail?.trim() || null,
            TeamPlayer: { create: players.map((p) => ({ firstName: p.firstName, lastName: p.lastName })) },
          },
          include: { TeamPlayer: { select: PLAYER_SELECT }, TeamType: true },
        });
        // El editToken solo se entrega aca, al crear
        return { ...this.toTeamView(team), editToken: team.editToken };
      });
    } catch (e) {
      this.rethrowUnique(e, 'Ya hay un equipo con ese nombre en esta categoria');
    }
  }

  async getByToken(id: string, token: string) {
    return this.toTeamView(await this.findByToken(id, token));
  }

  async updateByToken(id: string, token: string, dto: UpdateTeamDto) {
    const team = await this.findByToken(id, token);
    return this.applyUpdate(team.id, team.TeamType, dto);
  }

  // ------------------------------------------------------------------ admin

  async adminListTypes(eventId: string) {
    const types = await this.prisma.teamType.findMany({
      where: { eventId, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { Team: { where: { deletedAt: null } } } } },
    });
    return types.map(({ _count, ...t }) => ({ ...t, teamsCount: _count.Team }));
  }

  async createType(dto: CreateTeamTypeDto) {
    this.assertTypeLimits(dto.minPlayers ?? 1, dto.maxPlayers ?? 10);
    const event = await this.prisma.event.findFirst({ where: { id: dto.eventId, deletedAt: null } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    try {
      return await this.prisma.teamType.create({ data: { ...dto, name: cleanText(dto.name) } });
    } catch (e) {
      this.rethrowUnique(e, 'Ya existe un tipo con ese nombre en el evento');
    }
  }

  async updateType(id: string, dto: UpdateTeamTypeDto) {
    const current = await this.prisma.teamType.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw new NotFoundException('Tipo de equipo no encontrado');
    this.assertTypeLimits(dto.minPlayers ?? current.minPlayers, dto.maxPlayers ?? current.maxPlayers);
    try {
      return await this.prisma.teamType.update({
        where: { id },
        data: { ...dto, ...(dto.name ? { name: cleanText(dto.name) } : {}) },
      });
    } catch (e) {
      this.rethrowUnique(e, 'Ya existe un tipo con ese nombre en el evento');
    }
  }

  async removeType(id: string) {
    const type = await this.prisma.teamType.findFirst({ where: { id, deletedAt: null } });
    if (!type) throw new NotFoundException('Tipo de equipo no encontrado');
    const teams = await this.prisma.team.count({ where: { teamTypeId: id, deletedAt: null } });
    if (teams > 0) {
      throw new ConflictException('El tipo tiene equipos inscriptos: desactivalo en lugar de borrarlo');
    }
    await this.prisma.teamType.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, isPublished: false } });
    return { success: true };
  }

  async adminListTeams(eventId: string, teamTypeId?: string, q?: string) {
    const term = q?.trim();
    const teams = await this.prisma.team.findMany({
      where: {
        deletedAt: null,
        TeamType: { eventId, deletedAt: null },
        ...(teamTypeId ? { teamTypeId } : {}),
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { leaderName: { contains: term, mode: 'insensitive' } },
                { TeamPlayer: { some: { OR: [
                  { firstName: { contains: term, mode: 'insensitive' } },
                  { lastName: { contains: term, mode: 'insensitive' } },
                ] } } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
      include: { TeamPlayer: { select: PLAYER_SELECT, orderBy: { createdAt: 'asc' } }, TeamType: true },
    });
    return teams.map((t) => ({ ...this.toTeamView(t), leaderEmail: t.leaderEmail, createdAt: t.createdAt }));
  }

  async adminUpdateTeam(id: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findFirst({ where: { id, deletedAt: null }, include: { TeamType: true } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return this.applyUpdate(team.id, team.TeamType, dto);
  }

  async adminDeleteTeam(id: string) {
    const team = await this.prisma.team.findFirst({ where: { id, deletedAt: null } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    await this.prisma.team.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ---------------------------------------------------------------- helpers

  private async findByToken(id: string, token: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, editToken: token, deletedAt: null },
      include: { TeamPlayer: { select: PLAYER_SELECT, orderBy: { createdAt: 'asc' } }, TeamType: true },
    });
    // Mismo mensaje para id inexistente y token incorrecto
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return team;
  }

  /** Actualiza datos y sincroniza participantes por id: actualiza, crea y elimina los que faltan */
  private async applyUpdate(
    teamId: string,
    type: { name: string; minPlayers: number; maxPlayers: number },
    dto: UpdateTeamDto,
  ) {
    const players = dto.players ? normalizePlayers(dto.players) : null;
    if (players) assertPlayers(type, players);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.team.update({
          where: { id: teamId },
          data: {
            ...(dto.name ? { name: cleanText(dto.name) } : {}),
            ...(dto.leaderName ? { leaderName: cleanText(dto.leaderName) } : {}),
            ...(dto.leaderPhone ? { leaderPhone: cleanText(dto.leaderPhone) } : {}),
            ...(dto.leaderEmail !== undefined ? { leaderEmail: dto.leaderEmail.trim() || null } : {}),
          },
        });
        if (players) await this.syncPlayers(tx, teamId, players);
        const fresh = await tx.team.findUniqueOrThrow({
          where: { id: teamId },
          include: { TeamPlayer: { select: PLAYER_SELECT, orderBy: { createdAt: 'asc' } }, TeamType: true },
        });
        return this.toTeamView(fresh);
      });
    } catch (e) {
      this.rethrowUnique(e, 'Ya hay un equipo con ese nombre en esta categoria');
    }
  }

  private async syncPlayers(tx: Prisma.TransactionClient, teamId: string, players: PlayerDto[]) {
    const existing = await tx.teamPlayer.findMany({ where: { teamId }, select: { id: true } });
    const existingIds = new Set(existing.map((p) => p.id));
    const keepIds = new Set(players.filter((p) => p.id && existingIds.has(p.id)).map((p) => p.id as string));

    const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
    if (toDelete.length) await tx.teamPlayer.deleteMany({ where: { id: { in: toDelete } } });

    for (const p of players) {
      if (p.id && keepIds.has(p.id)) {
        await tx.teamPlayer.update({ where: { id: p.id }, data: { firstName: p.firstName, lastName: p.lastName } });
      } else {
        await tx.teamPlayer.create({ data: { teamId, firstName: p.firstName, lastName: p.lastName } });
      }
    }
  }

  private assertTypeLimits(min: number, max: number) {
    if (min > max) throw new BadRequestException('El minimo de participantes no puede superar al maximo');
  }

  private rethrowUnique(e: unknown, message: string): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException(message);
    }
    throw e;
  }

  private toPublicType(t: {
    id: string; name: string; description: string | null; minPlayers: number; maxPlayers: number;
    maxTeams: number | null; price: number; _count: { Team: number };
  }) {
    const teamsCount = t._count.Team;
    const remaining = t.maxTeams === null ? null : Math.max(t.maxTeams - teamsCount, 0);
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      minPlayers: t.minPlayers,
      maxPlayers: t.maxPlayers,
      price: t.price,
      remaining,
      full: remaining === 0,
    };
  }

  private toTeamView(team: {
    id: string; name: string; leaderName: string; leaderPhone: string; leaderEmail?: string | null;
    TeamType: { id: string; name: string; minPlayers: number; maxPlayers: number };
    TeamPlayer: { id: string; firstName: string; lastName: string }[];
  }) {
    return {
      id: team.id,
      name: team.name,
      leaderName: team.leaderName,
      leaderPhone: team.leaderPhone,
      leaderEmail: team.leaderEmail ?? null,
      teamType: {
        id: team.TeamType.id,
        name: team.TeamType.name,
        minPlayers: team.TeamType.minPlayers,
        maxPlayers: team.TeamType.maxPlayers,
      },
      players: team.TeamPlayer,
    };
  }
}
