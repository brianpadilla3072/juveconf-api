import { buildOrderPurchase } from './order-purchase';

describe('buildOrderPurchase', () => {
  const createdAt = new Date('2026-10-26T20:30:00Z');

  it('usa las comidas de cada invitado cuando ya estan creados', () => {
    const purchase = buildOrderPurchase({
      comboName: 'Inscripción Conferencia',
      createdAt,
      invitees: [
        { name: 'Ana', cuil: '1', MealSelection: [{ optionName: 'Menú #1 - Pizza' }] },
        { name: 'Luis', cuil: '2', MealSelection: [] },
      ],
    });
    expect(purchase.comboName).toBe('Inscripción Conferencia');
    expect(purchase.quantity).toBe(2);
    expect(purchase.purchasedAt).toEqual(createdAt);
    expect(purchase.people[0].meals).toEqual(['Menú #1 - Pizza']);
    expect(purchase.people[1].meals).toEqual([]);
  });

  it('antes de aprobar toma personas y comidas del metadata y el snapshot', () => {
    const purchase = buildOrderPurchase({
      comboName: 'Combo',
      createdAt,
      invitees: [],
      attendees: [{ name: 'Ana', cuil: '1' }, { name: 'Luis', cuil: '2' }],
      snapshot: { quantity: 2, meals: { perAttendee: [{ picks: [{ optionName: 'Choripán' }] }, {}] } },
    });
    expect(purchase.quantity).toBe(2);
    expect(purchase.people).toEqual([
      { name: 'Ana', cuil: '1', meals: ['Choripán'] },
      { name: 'Luis', cuil: '2', meals: [] },
    ]);
  });

  it('sin personas ni snapshot no rompe', () => {
    const purchase = buildOrderPurchase({ comboName: null, createdAt, invitees: [] });
    expect(purchase.quantity).toBe(0);
    expect(purchase.people).toEqual([]);
  });
});
