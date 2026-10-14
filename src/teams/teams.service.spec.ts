/* eslint-disable prettier/prettier */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TeamsService } from './teams.service';

const TYPE = { id: 't1', name: 'Futbol femenino', minPlayers: 2, maxPlayers: 3, maxTeams: 2, isActive: true, isPublished: true };
const dto = (over: Record<string, unknown> = {}) => ({
  teamTypeId: 't1',
  name: 'Las Halcones',
  leaderName: 'Ana Perez',
  leaderPhone: '2914000000',
  players: [{ firstName: 'Ana', lastName: 'Perez' }, { firstName: 'Luis', lastName: 'Diaz' }],
  ...over,
}) as any;

function serviceWith(opts: { type?: any; count?: number } = {}) {
  const created = { id: 'team1', editToken: 'tok', name: 'Las Halcones', leaderName: 'Ana Perez', leaderPhone: '2914000000', leaderEmail: null, TeamType: TYPE, TeamPlayer: [] };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    teamType: { findFirst: jest.fn().mockResolvedValue('type' in opts ? opts.type : TYPE) },
    team: { count: jest.fn().mockResolvedValue(opts.count ?? 0), create: jest.fn().mockResolvedValue(created) },
  };
  const prisma = { $transaction: jest.fn((fn: any) => fn(tx)), team: { findFirst: jest.fn() } };
  return { service: new TeamsService(prisma as any), tx, prisma };
}

describe('TeamsService.createTeam', () => {
  it('crea el equipo y devuelve el editToken solo en la creacion', async () => {
    const { service, tx } = serviceWith();
    const res = await service.createTeam(dto());
    expect(res.editToken).toBe('tok');
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.team.create.mock.calls[0][0].data.TeamPlayer.create).toHaveLength(2);
  });

  it('409 cuando el tipo alcanzo maxTeams', async () => {
    const { service, tx } = serviceWith({ count: 2 });
    await expect(service.createTeam(dto())).rejects.toThrow(ConflictException);
    expect(tx.team.create).not.toHaveBeenCalled();
  });

  it('404 si el tipo no existe, esta inactivo o no esta publicado', async () => {
    await expect(serviceWith({ type: null }).service.createTeam(dto())).rejects.toThrow(NotFoundException);
    await expect(serviceWith({ type: { ...TYPE, isActive: false } }).service.createTeam(dto())).rejects.toThrow(NotFoundException);
    await expect(serviceWith({ type: { ...TYPE, isPublished: false } }).service.createTeam(dto())).rejects.toThrow(NotFoundException);
  });

  it('no aplica limite de equipos cuando maxTeams es null', async () => {
    const { service } = serviceWith({ type: { ...TYPE, maxTeams: null }, count: 999 });
    await expect(service.createTeam(dto())).resolves.toBeDefined();
  });

  it('400 si hay mas jugadores que el maximo del tipo', async () => {
    const { service } = serviceWith();
    const players = ['A', 'B', 'C', 'D'].map((n) => ({ firstName: n, lastName: n }));
    await expect(service.createTeam(dto({ players }))).rejects.toThrow(/como maximo 3/);
  });
});

describe('TeamsService.getByToken', () => {
  it('404 con token incorrecto (mismo mensaje que id inexistente)', async () => {
    const { service, prisma } = serviceWith();
    prisma.team.findFirst.mockResolvedValue(null);
    await expect(service.getByToken('id', 'bad')).rejects.toThrow('Equipo no encontrado');
    expect(prisma.team.findFirst.mock.calls[0][0].where).toMatchObject({ id: 'id', editToken: 'bad', deletedAt: null });
  });
});
