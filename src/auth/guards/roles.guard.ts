/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Aplica @Roles(...). Debe ir despues de JwtAuthGuard. El JWT solo trae el email, asi que
 * el rol se lee de la BD en cada request (tambien descarta usuarios borrados).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const email: string | undefined = request.user?.email;
    if (!email) throw new UnauthorizedException('Token invalido');

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    request.user = { ...request.user, id: user.id, role: user.role };

    if (required?.length && !required.includes(user.role)) {
      throw new ForbiddenException('No tenes permisos para esta accion');
    }
    return true;
  }
}
