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
  const jwt = { signMetadata: jest.fn().mockReturnValue('token') };
  const emails = { enqueueTemplateEmail: jest.fn().mockResolvedValue({}) };
  return { service: new TeamsService(prisma as any, jwt as any, emails as any), tx, prisma, jwt, emails };
}

describe('TeamsService.createTeam', () => {
  it('crea el equipo y devuelve el editToken solo en la creacion', async () => {
    const { service, tx } = serviceWith();
    const res = await service.createTeam(dto());
    expect(res.editToken).toBe('tok');
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.team.create.mock.calls[0][0].data.TeamPlayer.create).toHaveLength(2);
  });

  it('acepta equipos sin datos del lider (quedan en null)', async () => {
    const { service, tx } = serviceWith();
    await service.createTeam(dto({ leaderName: undefined, leaderPhone: undefined }));
    expect(tx.team.create.mock.calls[0][0].data).toMatchObject({ leaderName: null, leaderPhone: null, leaderEmail: null });
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

// ---------------------------------------------------------- inscripcion con pago

const orderDto = (over: Record<string, unknown> = {}) => ({
  teamTypeId: 't1',
  name: 'Las Halcones',
  leaderName: 'Ana Perez',
  leaderCuil: '20456789012',
  leaderEmail: 'ana@example.com',
  leaderPhone: '2914000000',
  players: [{ firstName: 'Ana', lastName: 'Perez' }, { firstName: 'Luis', lastName: 'Diaz' }],
  ...over,
}) as any;

function orderServiceWith(opts: { type?: any; combo?: any; teamNameTaken?: boolean; pendingOrder?: boolean; reserved?: number } = {}) {
  const type = 'type' in opts ? opts.type : { ...TYPE, price: 25000, eventId: 'e1' };
  const combo = 'combo' in opts ? opts.combo : { id: 'combo-team' };
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    teamType: { findFirst: jest.fn().mockResolvedValue(type) },
    combo: { findFirst: jest.fn().mockResolvedValue(combo), create: jest.fn().mockResolvedValue({ id: 'combo-team' }) },
    team: {
      count: jest.fn().mockResolvedValue(opts.reserved ?? 0),
      findFirst: jest.fn().mockResolvedValue(opts.teamNameTaken ? { id: 'existing' } : null),
      create: jest.fn(),
    },
    order: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(opts.pendingOrder ? { id: 'pending' } : null),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'order1', ...data })),
      update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'order1', email: 'ana@example.com', year: 2026, total: 25000, ...data })),
    },
  };
  const prisma = { $transaction: jest.fn((fn: any) => fn(tx)) };
  const jwt = { signMetadata: jest.fn().mockReturnValue('token') };
  const emails = { enqueueTemplateEmail: jest.fn().mockResolvedValue({}) };
  return { service: new TeamsService(prisma as any, jwt as any, emails as any), tx, prisma, jwt, emails };
}

describe('TeamsService.createOrder', () => {
  it('crea una orden en revision con el equipo en el snapshot y NO crea el equipo', async () => {
    const { service, tx } = orderServiceWith();
    const res = await service.createOrder(orderDto());
    expect(res).toEqual({ success: true, orderID: 'order1' });
    expect(tx.team.create).not.toHaveBeenCalled();
    const data = tx.order.create.mock.calls[0][0].data;
    expect(data.status).toBe('REVIEW');
    expect(data.paymentType).toBe('TRANSFER');
    expect(data.total).toBe(25000);
    expect(data.orderSnapshot.team).toMatchObject({ kind: 'team', teamTypeId: 't1', name: 'Las Halcones' });
    expect(data.orderSnapshot.team.players).toHaveLength(2);
  });

  it('precio 0 (tipo gratis) crea igual la orden, en 0', async () => {
    const { service, tx } = orderServiceWith({ type: { ...TYPE, price: 0, eventId: 'e1' } });
    await service.createOrder(orderDto());
    expect(tx.order.create.mock.calls[0][0].data.total).toBe(0);
  });

  it('409 si ya hay un equipo con ese nombre', async () => {
    const { service } = orderServiceWith({ teamNameTaken: true });
    await expect(service.createOrder(orderDto())).rejects.toThrow(ConflictException);
  });

  it('409 si hay una inscripcion en curso con ese nombre', async () => {
    const { service } = orderServiceWith({ pendingOrder: true });
    await expect(service.createOrder(orderDto())).rejects.toThrow(ConflictException);
  });

  it('404 si el tipo no esta disponible', async () => {
    await expect(orderServiceWith({ type: null }).service.createOrder(orderDto())).rejects.toThrow(NotFoundException);
  });

  it('409 si el tipo alcanzo el cupo contando ordenes sin resolver', async () => {
    const { service, tx } = orderServiceWith({ reserved: 2 });
    await expect(service.createOrder(orderDto())).rejects.toThrow(ConflictException);
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it('crea un combo interno del evento si no existe', async () => {
    const { service, tx } = orderServiceWith({ combo: null });
    await service.createOrder(orderDto());
    expect(tx.combo.create).toHaveBeenCalled();
    expect(tx.order.create.mock.calls[0][0].data.comboId).toBe('combo-team');
  });
});
