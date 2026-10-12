/* eslint-disable prettier/prettier */
import { NotFoundException } from '@nestjs/common';
import { MealsService } from './meals.service';

const invitee = (over: Record<string, unknown> = {}) => ({
  id: 'inv-1',
  name: 'Juan Pérez',
  registrationCode: 'JC-0247',
  Order: { status: 'PAID' },
  MealSelection: [{ slotCode: 'SAT_NIGHT', optionName: 'Menú #3 - Súper pancho + agua', deliveredAt: null }],
  ...over,
});

const serviceWith = (prisma: unknown) => new MealsService(prisma as any, {} as any);

describe('MealsService.scan (estados del buffet)', () => {
  const scanWith = (found: unknown) =>
    serviceWith({ invitee: { findFirst: jest.fn().mockResolvedValue(found) } }).scan({
      inviteeId: 'inv-1',
      paymentId: 'pay-1',
      slotCode: 'SAT_NIGHT',
    } as any);

  it('PENDING: compro ese turno y no se entrego', async () => {
    await expect(scanWith(invitee())).resolves.toMatchObject({ status: 'PENDING', menu: 'Menú #3 - Súper pancho + agua', name: 'Juan Pérez' });
  });

  it('DELIVERED: ya se entrego', async () => {
    const delivered = invitee({ MealSelection: [{ slotCode: 'SAT_NIGHT', optionName: 'X', deliveredAt: new Date() }] });
    await expect(scanWith(delivered)).resolves.toMatchObject({ status: 'DELIVERED' });
  });

  it('NOT_PURCHASED: no compro ese turno', async () => {
    await expect(scanWith(invitee({ MealSelection: [] }))).resolves.toMatchObject({ status: 'NOT_PURCHASED', menu: null });
  });

  it('UNPAID: la orden no esta paga', async () => {
    await expect(scanWith(invitee({ Order: { status: 'CANCELLED' } }))).resolves.toMatchObject({ status: 'UNPAID' });
  });

  it('404 si el inviteeId/paymentId no corresponden a ninguna entrada', async () => {
    await expect(scanWith(null)).rejects.toThrow(NotFoundException);
  });

  it('solo expone los campos minimos del buffet', async () => {
    const view = await scanWith(invitee());
    expect(Object.keys(view).sort()).toEqual(['code', 'deliveredAt', 'inviteeId', 'menu', 'name', 'status']);
  });
});

describe('MealsService.deliver (entrega atomica)', () => {
  const build = (updateCount: number, selection: unknown) => {
    const updateMany = jest.fn().mockResolvedValue({ count: updateCount });
    const findUnique = jest.fn().mockResolvedValue(selection);
    return { service: serviceWith({ mealSelection: { updateMany, findUnique } }), updateMany };
  };
  const dto = { inviteeId: 'inv-1', slotCode: 'SAT_NIGHT' };

  it('la primera llamada entrega y guarda quien la entrego; el filtro exige no entregada y orden paga', async () => {
    const { service, updateMany } = build(1, null);
    await expect(service.deliver(dto, 'user-9')).resolves.toEqual({ delivered: true, status: 'DELIVERED' });
    expect(updateMany.mock.calls[0][0]).toMatchObject({
      where: { inviteeId: 'inv-1', slotCode: 'SAT_NIGHT', deliveredAt: null, Invitee: { Order: { status: 'PAID' } } },
      data: { deliveredById: 'user-9' },
    });
  });

  it('si ya estaba entregada informa DELIVERED sin volver a entregar', async () => {
    const at = new Date();
    const { service } = build(0, { deliveredAt: at, Invitee: { Order: { status: 'PAID' } } });
    await expect(service.deliver(dto, 'u')).resolves.toEqual({ delivered: false, status: 'DELIVERED', deliveredAt: at });
  });

  it('NOT_PURCHASED y UNPAID cuando corresponde', async () => {
    await expect(build(0, null).service.deliver(dto, 'u')).resolves.toEqual({ delivered: false, status: 'NOT_PURCHASED' });
    const unpaid = { deliveredAt: null, Invitee: { Order: { status: 'REVIEW' } } };
    await expect(build(0, unpaid).service.deliver(dto, 'u')).resolves.toEqual({ delivered: false, status: 'UNPAID' });
  });
});
