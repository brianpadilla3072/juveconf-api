/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controler';
import { AuthService } from './auth.service';
import { PasswordService } from '../global/password.service';  // Asegúrate de incluir el PasswordService
import { PrismaService } from 'prisma/prisma.service';  // PrismaService para interactuar con la base de datos
import { JwtModule } from '@nestjs/jwt'; // Si deseas utilizar JWT

@Module({
  imports: [
    JwtModule.register({
      secret: 'yourSecretKey', // Coloca tu clave secreta aquí o usa variables de entorno
      signOptions: { expiresIn: '60m' }, // Configura el tiempo de expiración del token
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, PrismaService],
})
export class AuthModule {}
