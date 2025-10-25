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
import { EmailQueueService } from '../email-queue/email-queue.service';
import { EmailType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
    private jwtService: JwtService,
    private emailQueueService: EmailQueueService,
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
  async login(email: string, password: string): Promise<{ access_token: string; requirePasswordChange?: boolean }> {
    const isValid = await this.validateUser(email, password);

    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas. Verifica tu email y contraseña.');
    }

    // Buscar usuario para obtener requirePasswordChange
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, requirePasswordChange: true },
    });

    // Aquí generas el token JWT, puedes incluir más datos si lo necesitas
    const payload = { email, sub: user!.id, requirePasswordChange: user!.requirePasswordChange };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      ...(user!.requirePasswordChange && { requirePasswordChange: true }),
    };
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

    // Actualizar la contraseña en la base de datos y marcar requirePasswordChange = false
    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedNewPassword,
        requirePasswordChange: false,
      },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Genera una contraseña segura aleatoria
   * Incluye: letras mayúsculas, minúsculas, números y símbolos
   */
  private generateSecurePassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + symbols;

    // Generar contraseña asegurando al menos un carácter de cada tipo
    let password = '';
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];

    // Completar el resto de la contraseña
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Mezclar los caracteres para que no siempre empiecen con el mismo patrón
    return password.split('').sort(() => crypto.randomInt(0, 2) - 0.5).join('');
  }

  /**
   * Solicita un reset de contraseña
   * Genera una contraseña temporal y envía email
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Por seguridad, siempre retornamos el mismo mensaje
    // incluso si el usuario no existe (evitar enumeración de emails)
    if (!user) {
      return {
        message: 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña',
      };
    }

    // Generar contraseña temporal segura
    const temporaryPassword = this.generateSecurePassword(12);

    // Hashear la contraseña temporal
    const hashedPassword = await this.passwordService.hashPassword(temporaryPassword);

    // Actualizar usuario: nueva contraseña y marcar que debe cambiarla
    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        requirePasswordChange: true,
      },
    });

    // Encolar email con la contraseña temporal
    await this.emailQueueService.enqueueTemplateEmail({
      to: email,
      subject: 'Contraseña Temporal - JUVECONF 2025',
      template: 'reset-password',
      context: {
        userName: user.name || email.split('@')[0],
        temporaryPassword: temporaryPassword,
      },
      emailType: EmailType.PASSWORD_RESET,
    });

    console.log(`[DEBUG] Contraseña temporal generada y email encolado para ${email}`);

    return {
      message: 'Si el email existe en nuestro sistema, recibirás instrucciones para restablecer tu contraseña',
    };
  }
}
