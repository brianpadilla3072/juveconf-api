/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AdminMealsQueryDto, DeliverMealDto, LookupMealDto, ScanMealDto, UpdateMealConfigDto } from './dto/meals.dto';
import { MealsService } from './meals.service';

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN];
const BUFFET_ROLES = [...ADMIN_ROLES, UserRole.COLLABORATOR, UserRole.BUFFET];

@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  // ---- publico ----

  @Get('public/:eventId')
  getPublicConfig(@Param('eventId', new ParseUUIDPipe()) eventId: string) {
    return this.mealsService.getPublicConfig(eventId);
  }

  @Post('public/orders/:orderId/proof-sent')
  @HttpCode(200)
  markProofSent(@Param('orderId', new ParseUUIDPipe()) orderId: string) {
    return this.mealsService.markProofSent(orderId);
  }

  // ---- administracion ----

  @Patch('config/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  setConfig(@Param('eventId', new ParseUUIDPipe()) eventId: string, @Body() dto: UpdateMealConfigDto) {
    return this.mealsService.setConfig(eventId, dto);
  }

  @Get('admin/registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  registrations(@Query() query: AdminMealsQueryDto) {
    return this.mealsService.registrations(query.eventId, query.q);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  stats(@Query() query: AdminMealsQueryDto) {
    return this.mealsService.stats(query.eventId);
  }

  // ---- buffet (respuestas minimas, sin datos personales) ----

  @Post('scan')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...BUFFET_ROLES)
  scan(@Body() dto: ScanMealDto) {
    return this.mealsService.scan(dto);
  }

  @Get('lookup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...BUFFET_ROLES)
  lookup(@Query() query: LookupMealDto) {
    return this.mealsService.lookup(query);
  }

  @Post('deliver')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...BUFFET_ROLES)
  deliver(@Body() dto: DeliverMealDto, @Req() req: { user?: { id?: string } }) {
    return this.mealsService.deliver(dto, req.user?.id);
  }
}
