import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PasswordService } from '../global/password.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './DTOs/register-user.dto';
import { ChangePasswordDto } from './DTOs/change-password.dto';

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
      return false; // Usuario no encontrado
    }
    if (!user.password) {
      throw new UnauthorizedException(
        'El usuario no tiene contraseña local asignada.',
      );
    }
    // Compara la contraseña en texto claro con la contraseña cifrada
    const isPasswordValid = await this.passwordService.comparePasswords(
      password,
      user.password,
    );

    return isPasswordValid;
  }

  // Si necesitas generar un token JWT, aquí tienes un ejemplo
  async login(email: string, password: string): Promise<string> {
    const isValid = await this.validateUser(email, password);

    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu email y contraseña.');
    }

    // Aquí generas el token JWT, puedes incluir más datos si lo necesitas
    const payload = { email };
    return this.jwtService.sign(payload); // Devuelve el token
  }

  // Método para registrar un nuevo usuario
  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ access_token: string }> {
    // Verificar si el email ya está en uso
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // Verificar si el DNI ya está en uso
    const existingDni = await this.prisma.user.findUnique({
      where: { dni: registerUserDto.dni },
    });

    if (existingDni) {
      throw new ConflictException('El DNI ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await this.passwordService.hashPassword(
      registerUserDto.password,
    );

    // Crear el usuario en la base de datos
    const user = await this.prisma.user.create({
      data: {
        ...registerUserDto,
        password: hashedPassword,
        provider: 'LOCAL',
        emailVerified: false, // Podrías querer enviar un correo de verificación
      },
    });

    // Generar token JWT
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async getUserProfile(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Método para cambiar contraseña
  async changePassword(
    email: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Buscar el usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.password) {
      throw new BadRequestException(
        'El usuario no tiene contraseña local asignada',
      );
    }

    // Verificar que la contraseña actual sea correcta
    const isCurrentPasswordValid = await this.passwordService.comparePasswords(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await this.passwordService.comparePasswords(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    // Hashear la nueva contraseña
    const hashedNewPassword = await this.passwordService.hashPassword(
      newPassword,
    );

    // Actualizar la contraseña en la base de datos
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedNewPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
