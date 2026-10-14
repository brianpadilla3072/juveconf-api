/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';

export interface PlayerInput {
  id?: string;
  firstName: string;
  lastName: string;
}

export interface TypeLimits {
  name: string;
  minPlayers: number;
  maxPlayers: number;
}

const clean = (value: string) => value.trim().replace(/\s+/g, ' ');

/** Limpia espacios y descarta filas vacias */
export function normalizePlayers(players: PlayerInput[]): PlayerInput[] {
  return players
    .map((p) => ({ id: p.id, firstName: clean(p.firstName ?? ''), lastName: clean(p.lastName ?? '') }))
    .filter((p) => p.firstName !== '' || p.lastName !== '');
}

/** Valida cantidad (min/max del tipo), nombre y apellido obligatorios y que no haya repetidos */
export function assertPlayers(type: TypeLimits, players: PlayerInput[]): void {
  if (players.some((p) => !p.firstName || !p.lastName)) {
    throw new BadRequestException('Cada participante necesita nombre y apellido');
  }
  if (players.length > type.maxPlayers) {
    throw new BadRequestException(`"${type.name}" admite como maximo ${type.maxPlayers} participantes`);
  }
  if (players.length < type.minPlayers) {
    throw new BadRequestException(`"${type.name}" requiere al menos ${type.minPlayers} participantes`);
  }
  const seen = new Set<string>();
  for (const p of players) {
    const key = `${p.firstName} ${p.lastName}`.toLowerCase();
    if (seen.has(key)) {
      throw new BadRequestException(`El participante "${p.firstName} ${p.lastName}" esta repetido`);
    }
    seen.add(key);
  }
}

export const cleanText = clean;
