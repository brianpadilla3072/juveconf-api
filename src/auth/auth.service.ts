/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// eslint-disable-next-line prettier/prettier
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PasswordService } from '../global/password.service'; // Este es el servicio para manejar las contraseñas
import { JwtService } from '@nestjs/jwt'; // Si deseas usar JWT en el futuro

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private jwtService: JwtService, // Si vas a usar JWT
  ) {}

  // Método para validar al usuario por email y contraseña
  async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return false;  // Usuario no encontrado
    }

    // Compara la contraseña en texto claro con la contraseña cifrada
    const isPasswordValid = await this.passwordService.comparePasswords(password, user.password);

    return isPasswordValid;
  }

  // Si necesitas generar un token JWT, aquí tienes un ejemplo
  async login(email: string, password: string): Promise<string> {
    const isValid = await this.validateUser(email, password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Aquí generas el token JWT, puedes incluir más datos si lo necesitas
    const payload = { email };
    return this.jwtService.sign(payload); // Devuelve el token
  }
}
