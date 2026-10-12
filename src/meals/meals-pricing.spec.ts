/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';
import { MealConfig } from './meals-config.schema';
import { discountPercentFor, quoteMeals } from './meals-pricing';

const config: MealConfig = {
  slots: [
    { code: 'FRI_NIGHT', name: 'Viernes noche', order: 1, options: [{ n: 1, name: '½ pizza + agua', price: 5000 }] },
    {
      code: 'SAT_NIGHT',
      name: 'Sábado noche',
      order: 2,
      options: [
        { n: 1, name: 'Sándwich de milanesa + agua', price: 6000 },
        { n: 2, name: '3 empanadas + agua', price: 4500 },
        { n: 3, name: 'Súper pancho + agua', price: 3999 },
      ],
    },
    { code: 'SUN_NOON', name: 'Domingo mediodía', order: 3, options: [{ n: 1, name: 'Sándwich de carne mechada + agua', price: 7000 }] },
    { code: 'SUN_NIGHT', name: 'Domingo noche', order: 4, options: [{ n: 1, name: 'Pancho + agua', price: 3000 }] },
  ],
  discountTiers: { '2': 10, '3': 15, '4': 20 },
};

describe('discountPercentFor', () => {
  const tiers = config.discountTiers;
  it.each([[0, 0], [1, 0], [2, 10], [3, 15], [4, 20], [5, 20]])('%i comidas -> %i%%', (count, pct) => {
    expect(discountPercentFor(count, tiers)).toBe(pct);
  });
});

describe('quoteMeals', () => {
  it('una comida: precio normal', () => {
    const q = quoteMeals(config, [[{ slotCode: 'FRI_NIGHT', optionNumber: 1 }]]);
    expect(q.mealsTotal).toBe(5000);
    expect(q.perAttendee[0]).toMatchObject({ subtotal: 5000, discountPercent: 0, discount: 0, total: 5000 });
  });

  it('cuatro comidas: aplica el escalon de 4 y redondea a pesos enteros', () => {
    const q = quoteMeals(config, [[
      { slotCode: 'FRI_NIGHT', optionNumber: 1 },
      { slotCode: 'SAT_NIGHT', optionNumber: 3 },
      { slotCode: 'SUN_NOON', optionNumber: 1 },
      { slotCode: 'SUN_NIGHT', optionNumber: 1 },
    ]]);
    // 5000 + 3999 + 7000 + 3000 = 18999 -> 20% off = 15199.2 -> 15199
    expect(q.perAttendee[0].subtotal).toBe(18999);
    expect(q.perAttendee[0].total).toBe(15199);
    expect(q.perAttendee[0].discount).toBe(3800);
    expect(q.mealsTotal).toBe(15199);
  });

  it('el descuento es por persona y los totales se suman', () => {
    const q = quoteMeals(config, [
      [{ slotCode: 'FRI_NIGHT', optionNumber: 1 }, { slotCode: 'SUN_NIGHT', optionNumber: 1 }],
      [{ slotCode: 'SUN_NOON', optionNumber: 1 }],
      undefined,
    ]);
    expect(q.perAttendee.map((a) => a.total)).toEqual([7200, 7000, 0]);
    expect(q.mealsTotal).toBe(14200);
  });

  it('etiqueta el menu con numero solo cuando el turno tiene varias opciones', () => {
    const q = quoteMeals(config, [[{ slotCode: 'SAT_NIGHT', optionNumber: 3 }, { slotCode: 'FRI_NIGHT', optionNumber: 1 }]]);
    expect(q.perAttendee[0].picks[0].optionName).toBe('Menú #3 - Súper pancho + agua');
    expect(q.perAttendee[0].picks[1].optionName).toBe('½ pizza + agua');
  });

  it('rechaza dos opciones en el mismo turno, turnos u opciones inexistentes', () => {
    expect(() => quoteMeals(config, [[{ slotCode: 'SAT_NIGHT', optionNumber: 1 }, { slotCode: 'SAT_NIGHT', optionNumber: 2 }]])).toThrow(BadRequestException);
    expect(() => quoteMeals(config, [[{ slotCode: 'NOPE', optionNumber: 1 }]])).toThrow(BadRequestException);
    expect(() => quoteMeals(config, [[{ slotCode: 'SAT_NIGHT', optionNumber: 9 }]])).toThrow(BadRequestException);
  });
});
