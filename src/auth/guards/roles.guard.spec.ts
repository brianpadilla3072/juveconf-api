/* eslint-disable prettier/prettier */
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

const contextWith = (user: unknown) => {
  const request = { user };
  return {
    request,
    ctx: {
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => request }),
    } as any,
  };
};

const build = (required: UserRole[] | undefined, dbUser: unknown) => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(required) } as unknown as Reflector;
  const prisma = { user: { findFirst: jest.fn().mockResolvedValue(dbUser) } } as any;
  return { guard: new RolesGuard(reflector, prisma), prisma };
};

describe('RolesGuard', () => {
  it('deja pasar cuando el rol de la BD esta permitido y lo adjunta al request', async () => {
    const { guard } = build([UserRole.ADMIN], { id: 'u1', role: UserRole.ADMIN });
    const { ctx, request } = contextWith({ email: 'a@a.com' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toMatchObject({ email: 'a@a.com', id: 'u1', role: UserRole.ADMIN });
  });

  it('rechaza con 403 un rol no permitido (BUFFET no es admin)', async () => {
    const { guard } = build([UserRole.ADMIN, UserRole.DEVELOPER], { id: 'u2', role: UserRole.BUFFET });
    await expect(guard.canActivate(contextWith({ email: 'b@b.com' }).ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rechaza sin usuario en el request o si el usuario no existe / esta borrado', async () => {
    const withNoUser = build([UserRole.ADMIN], null);
    await expect(withNoUser.guard.canActivate(contextWith(undefined).ctx)).rejects.toThrow(UnauthorizedException);
    await expect(withNoUser.guard.canActivate(contextWith({ email: 'x@x.com' }).ctx)).rejects.toThrow(UnauthorizedException);
    expect(withNoUser.prisma.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'x@x.com', deletedAt: null } }));
  });

  it('sin @Roles exige solo estar autenticado', async () => {
    const { guard } = build(undefined, { id: 'u3', role: UserRole.USER });
    await expect(guard.canActivate(contextWith({ email: 'c@c.com' }).ctx)).resolves.toBe(true);
  });
});
