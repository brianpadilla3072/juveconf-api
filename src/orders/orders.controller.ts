/* eslint-disable prettier/prettier */
import { 
  Controller, 
  Param, 
  Delete, 
  Put, 
  HttpCode, 
  HttpStatus, 
  NotFoundException, 
  Logger,
  Get, 
  UseGuards
} from '@nestjs/common';
import { OrdersService, OrderStatus } from './orders.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get('review')
    // @UseGuards(JwtAuthGuard)
    // @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
    getOrdersByReview() {
        return this.ordersService.getOrdersByStatus(OrderStatus.REVIEW);
    }
    @Get('pending')
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
    getOrdersByPending() {
        return this.ordersService.getOrdersByStatus(OrderStatus.PENDING);
    }
    @UseGuards(JwtAuthGuard)
    @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN, UserRole.COLLABORATOR)
    @Get('paid')
  getOrdersByPaid() {
    return this.ordersService.getOrdersByStatus(OrderStatus.PAID);
  }

  private readonly logger = new Logger(OrdersController.name);



  @Put(':id/approve')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  async approveOrder(@Param('id') id: string) {
    return await this.ordersService.approveOrder(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER, UserRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOrder(@Param('id') id: string) {
    try {
      await this.ordersService.deleteOrder(id);
      return { success: true };
    } catch (error: unknown) {
      this.logger.error(`Failed to delete order ${id}`, error instanceof Error ? error.stack : String(error));
      throw new NotFoundException('Order not found');
    }
  }


}
