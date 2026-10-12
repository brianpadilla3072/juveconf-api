/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';
import { isMinor } from './meals-registration.schema';
import {
  assertNoMeals,
  nextRegistrationCode,
  normalizeRegistrationCode,
  prepareMealsForOrder,
} from './meals-orders';

const mealConfig = {
  slots: [{ code: 'FRI_NIGHT', name: 'Viernes noche', order: 1, options: [{ n: 1, name: '½ pizza + agua', price: 5000 }] }],
  discountTiers: { '2': 10 },
};

const validMetadata = JSON.stringify({
  phone: '3511234567',
  birthdate: '1990-05-10',
  city: 'Córdoba',
  church: 'Vida Eterna',
  emergency: { name: 'Ana', phone: '3517654321' },
});

const prismaWith = (event: unknown) => ({ event: { findFirst: jest.fn().mockResolvedValue(event) } }) as any;
const comboOn = { eventId: 'evt', mealsEnabled: true };
const comboOff = { eventId: 'evt', mealsEnabled: false };

describe('normalizeRegistrationCode', () => {
  it.each([['JC-0247', 'JC-0247'], ['jc-247', 'JC-0247'], ['247', 'JC-0247'], [' 12 ', 'JC-0012']])('%s -> %s', (input, expected) => {
    expect(normalizeRegistrationCode(input)).toBe(expected);
  });
  it('devuelve null si no parece un codigo', () => {
    expect(normalizeRegistrationCode('Juan Perez')).toBeNull();
  });
});

describe('nextRegistrationCode', () => {
  it('usa el contador atomico del evento y rellena a 4 digitos', async () => {
    const update = jest.fn().mockResolvedValue({ registrationSeq: 7 });
    const code = await nextRegistrationCode({ event: { update } } as any, 'evt-1');
    expect(code).toBe('JC-0007');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: { registrationSeq: { increment: 1 } } }));
  });
});

describe('prepareMealsForOrder', () => {
  it('combo sin comidas y sin comidas en el pedido: flujo original (null), sin consultar el evento', async () => {
    const prisma = prismaWith({ mealConfig });
    const result = await prepareMealsForOrder(prisma, comboOff, [{ metadata: undefined }]);
    expect(result).toBeNull();
    expect(prisma.event.findFirst).not.toHaveBeenCalled();
  });

  it('combo sin comidas rechaza comidas aunque el evento tenga menus configurados', async () => {
    await expect(
      prepareMealsForOrder(prismaWith({ mealConfig }), comboOff, [{ meals: [{ slotCode: 'FRI_NIGHT', optionNumber: 1 }] }]),
    ).rejects.toThrow(BadRequestException);
  });

  it('combo con comidas: cotiza y valida el registro', async () => {
    const quote = await prepareMealsForOrder(prismaWith({ mealConfig }), comboOn, [
      { metadata: validMetadata, meals: [{ slotCode: 'FRI_NIGHT', optionNumber: 1 }] },
    ]);
    expect(quote?.mealsTotal).toBe(5000);
  });

  it('combo con comidas: rechaza datos de registro incompletos', async () => {
    await expect(
      prepareMealsForOrder(prismaWith({ mealConfig }), comboOn, [{ metadata: JSON.stringify({ phone: '123456' }) }]),
    ).rejects.toThrow(BadRequestException);
  });

  it('combo con comidas: exige adulto responsable para menores', async () => {
    const minor = JSON.stringify({ ...JSON.parse(validMetadata), birthdate: '2020-01-01' });
    await expect(prepareMealsForOrder(prismaWith({ mealConfig }), comboOn, [{ metadata: minor }])).rejects.toThrow(/responsable/);
  });

  it('combo con comidas pero evento sin configuracion: rechaza', async () => {
    await expect(prepareMealsForOrder(prismaWith({ mealConfig: null }), comboOn, [{}])).rejects.toThrow(BadRequestException);
  });
});

describe('assertNoMeals', () => {
  it('rechaza comidas en rutas de pago sin soporte y acepta el resto', () => {
    expect(() => assertNoMeals([{ meals: [{ slotCode: 'FRI_NIGHT', optionNumber: 1 }] }])).toThrow(BadRequestException);
    expect(() => assertNoMeals([{}])).not.toThrow();
    expect(() => assertNoMeals(undefined)).not.toThrow();
  });
});

describe('isMinor', () => {
  it('calcula la edad contra una fecha dada', () => {
    const now = new Date('2026-10-01T00:00:00Z');
    expect(isMinor('2010-10-02', now)).toBe(true);
    expect(isMinor('2008-10-01', now)).toBe(false);
    expect(isMinor('no-es-fecha', now)).toBe(false);
  });
});
