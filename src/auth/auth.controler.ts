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
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ access_token: string }> {
    const { email, password } = loginUserDto;
    const access_token = await this.authService.login(email, password);
    return { access_token };
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
