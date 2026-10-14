/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';
import { assertPlayers, normalizePlayers } from './teams-rules';

const type = { name: 'Futbol femenino', minPlayers: 2, maxPlayers: 3 };
const p = (firstName: string, lastName: string) => ({ firstName, lastName });

describe('normalizePlayers', () => {
  it('recorta espacios, colapsa repetidos y descarta filas vacias', () => {
    expect(normalizePlayers([p('  Ana ', ' Perez  Gomez'), p('', '  '), p('Luis', 'Diaz')])).toEqual([
      { id: undefined, firstName: 'Ana', lastName: 'Perez Gomez' },
      { id: undefined, firstName: 'Luis', lastName: 'Diaz' },
    ]);
  });
});

describe('assertPlayers', () => {
  it('acepta una lista valida dentro del rango', () => {
    expect(() => assertPlayers(type, [p('Ana', 'Perez'), p('Luis', 'Diaz')])).not.toThrow();
  });

  it('rechaza mas participantes que el maximo del tipo', () => {
    expect(() => assertPlayers(type, [p('A', 'A'), p('B', 'B'), p('C', 'C'), p('D', 'D')])).toThrow(/como maximo 3/);
  });

  it('rechaza menos participantes que el minimo del tipo', () => {
    expect(() => assertPlayers(type, [p('A', 'A')])).toThrow(/al menos 2/);
  });

  it('exige nombre y apellido', () => {
    expect(() => assertPlayers(type, [p('Ana', ''), p('Luis', 'Diaz')])).toThrow(BadRequestException);
  });

  it('rechaza repetidos sin distinguir mayusculas', () => {
    expect(() => assertPlayers(type, [p('Ana', 'Perez'), p('ANA', 'perez')])).toThrow(/repetido/);
  });
});
