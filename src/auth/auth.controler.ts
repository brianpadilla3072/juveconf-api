import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './DTOs/login-user.dto';
import { RegisterUserDto } from './DTOs/register-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { UserProfileDto } from './DTOs/profile.dto';

interface RequestWithUser extends Request {
  user: { email: string };
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ access_token: string }> {
    try {
      // Validar que los datos requeridos estén presentes
      if (!loginUserDto.email || !loginUserDto.password) {
        throw new BadRequestException('Email y contraseña son requeridos');
      }

      // Validar formato básico del email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginUserDto.email)) {
        throw new BadRequestException('Formato de email inválido');
      }

      const { email, password } = loginUserDto;
      
      this.logger.log(`Intento de login para email: ${email}`);
      
      const access_token = await this.authService.login(email, password);
      
      this.logger.log(`Login exitoso para email: ${email}`);
      
      return { access_token };
    } catch (error) {
      // Log del error para depuración
      this.logger.error(`Error en login: ${error.message}`, error.stack);
      
      // Re-lanzar errores HTTP conocidos
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error.name === 'UnauthorizedException') {
        throw error;
      }
      
      // Para cualquier otro error, devolver un error interno del servidor
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<{ access_token: string }> {
    return this.authService.register(registerUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: RequestWithUser): Promise<UserProfileDto> {
    const user = await this.authService.getUserProfile(req.user.email);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return new UserProfileDto({
      id: user.id,
      email: user.email,
      name: user.name,
      givenName: user.givenName || undefined,
      familyName: user.familyName || undefined,
      dni: user.dni,
      role: user.role,
      picture: user.picture || undefined,
      locale: user.locale || undefined,
      emailVerified: user.emailVerified,
      provider: user.provider,
      lastLogin: user.lastLogin || undefined,
      deletedAt: user.deletedAt || undefined,
    });
  }
}
