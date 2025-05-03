/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  // Cifra la contraseña con bcrypt
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10); // Genera un 'salt' con 10 rondas
    return bcrypt.hash(password, salt);  // Devuelve la contraseña cifrada
  }

  // Compara la contraseña en texto claro con la versión cifrada
  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);  // Devuelve si coinciden
  }
}
