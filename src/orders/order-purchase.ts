// Resumen de lo que compro una orden: combo, cantidad, fecha y hora, y comidas por persona.
// Se usa en el listado de ordenes y en el de pagos.

export interface PurchasePerson {
  name: string;
  cuil: string;
  meals: string[];
}

export interface OrderPurchase {
  comboName: string | null;
  quantity: number;
  purchasedAt: Date;
  people: PurchasePerson[];
}

interface InviteeLike {
  name: string;
  cuil: string;
  MealSelection?: { optionName: string }[];
}

interface AttendeeLike {
  name: string;
  cuil: string;
}

// orderSnapshot: { quantity, meals: { perAttendee: [{ picks: [{ optionName }] }] } }
interface SnapshotLike {
  quantity?: number;
  meals?: { perAttendee?: { picks?: { optionName: string }[] }[] };
}

export function buildOrderPurchase(params: {
  comboName?: string | null;
  createdAt: Date;
  invitees: InviteeLike[];
  attendees?: AttendeeLike[];
  snapshot?: unknown;
}): OrderPurchase {
  const snapshot = (params.snapshot ?? {}) as SnapshotLike;

  // Con invitados creados (orden aprobada) las comidas estan en MealSelection;
  // antes de aprobar salen de la cotizacion guardada en el snapshot.
  const people: PurchasePerson[] = params.invitees.length > 0
    ? params.invitees.map((i) => ({
        name: i.name,
        cuil: i.cuil,
        meals: (i.MealSelection ?? []).map((m) => m.optionName),
      }))
    : (params.attendees ?? []).map((a, index) => ({
        name: a.name,
        cuil: a.cuil,
        meals: snapshot.meals?.perAttendee?.[index]?.picks?.map((p) => p.optionName) ?? [],
      }));

  return {
    comboName: params.comboName ?? null,
    quantity: people.length || snapshot.quantity || 0,
    purchasedAt: params.createdAt,
    people,
  };
}
