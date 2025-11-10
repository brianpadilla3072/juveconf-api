import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controler';
import { AuthService } from './auth.service';
import { PasswordService } from '../global/password.service';
import { PrismaService } from 'prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailQueueModule } from '../email-queue/email-queue.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'yourSecretKey',
        signOptions: { expiresIn: '60m' },
      }),
    }),
    EmailQueueModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, PrismaService, JwtStrategy],
  exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
