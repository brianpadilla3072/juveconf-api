import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Query('year') year?: string, @Query('eventId') eventId?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    return this.dashboardService.getOverview(currentYear, eventId);
  }

  @Get('revenue-trends')
  async getRevenueTrends(@Query('months') months?: string, @Query('eventId') eventId?: string) {
    const monthsCount = months ? parseInt(months) : 12;
    return this.dashboardService.getRevenueTrends(monthsCount, eventId);
  }

  @Get('orders-analytics')
  async getOrdersAnalytics(@Query('year') year?: string, @Query('eventId') eventId?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    return this.dashboardService.getOrdersAnalytics(currentYear, eventId);
  }

  @Get('attendance-analytics')
  async getAttendanceAnalytics(@Query('year') year?: string, @Query('eventId') eventId?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    return this.dashboardService.getAttendanceAnalytics(currentYear, eventId);
  }

  @Get('combos-ranking')
  async getCombosRanking(@Query('year') year?: string, @Query('limit') limit?: string, @Query('eventId') eventId?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const limitCount = limit ? parseInt(limit) : 10;
    return this.dashboardService.getCombosRanking(currentYear, limitCount, eventId);
  }

  @Get('events-ranking')
  async getEventsRanking(@Query('year') year?: string, @Query('limit') limit?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const limitCount = limit ? parseInt(limit) : 5;
    return this.dashboardService.getEventsRanking(currentYear, limitCount);
  }

  @Get('activity-heatmap')
  async getActivityHeatmap(@Query('year') year?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    return this.dashboardService.getActivityHeatmap(currentYear);
  }

  @Get('pending-orders-debug')
  async getPendingOrdersDebug(@Query('year') year?: string) {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    return this.dashboardService.getPendingOrdersDebug(currentYear);
  }
}