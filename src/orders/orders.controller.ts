/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller } from '@nestjs/common';
import { OrdersService, OrderStatus } from './orders.service';
import { Get } from '@nestjs/common';
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get('review')
    getOrdersByReview() {
        return this.ordersService.getOrdersByStatus(OrderStatus.REVIEW);
    }
    @Get('pending')
    getOrdersByPending() {
        return this.ordersService.getOrdersByStatus(OrderStatus.PENDING);
    }
    @Get('paid')
    getOrdersByPaid() {
        return this.ordersService.getOrdersByStatus(OrderStatus.PAID);
    }
}
