/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PasswordService } from '../global/password.service';  

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService, private passwordService: PasswordService) {}
    async createUser(data: { name: string; email: string; password: string }) {
      // Cifra la contraseña antes de guardarla
      const hashedPassword = await this.passwordService.hashPassword(data.password);
  
      // Guarda el usuario con la contraseña cifrada
      return this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });
    }
      async findAllUsers() {
        return this.prisma.user.findMany();
      }
      async getUser(id: number) {
        const user = await this.prisma.user.findUnique({ where: { id }});
        if (!user) throw new NotFoundException(`Usuario ${id} no existe`);
        return user;
      }
      
      
}
