import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { TzOffset } from '../common/tz-offset.decorator';
import { UserId } from '../common/user-id.decorator';
import { UserService } from '../user/user.service';
import { DailyMetricsQueryDto } from './dto/daily-metrics-query.dto';
import { LogWaterDto } from './dto/log-water.dto';
import { RangeMetricsQueryDto } from './dto/range-metrics-query.dto';
import { StatsGraphQueryDto } from './dto/stats-graph-query.dto';
import { WaterService } from './water.service';

@Controller('water')
export class WaterController {
  constructor(
    private readonly waterService: WaterService,
    private readonly userService: UserService,
  ) {}

  @Post('log')
  @HttpCode(HttpStatus.OK)
  async logWater(
    @UserId() userId: string,
    @Body() body: LogWaterDto,
    @TzOffset() tzOffset: number,
  ) {
    try {
      const result = await this.waterService.logWater(userId, body.amount, tzOffset);
      return { success: true, ...result };
    } catch (error) {
      console.error('Log Water Error:', error);
      throw new HttpException({ error: 'Failed to log water' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('metrics')
  async getDailyMetrics(
    @UserId() userId: string,
    @Query() query: DailyMetricsQueryDto,
    @TzOffset() tzOffset: number,
  ) {
    try {
      const metrics = await this.waterService.getDailyMetrics(userId, query.date, tzOffset);
      return { success: true, ...metrics };
    } catch (error) {
      console.error('Get Metrics Error:', error);
      throw new HttpException(
        { error: 'Failed to fetch metrics' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('log')
  async revertLog(@UserId() userId: string, @TzOffset() tzOffset: number) {
    const result = await this.waterService.revertLog(userId, tzOffset);
    return { success: true, ...result };
  }

  @Get('range')
  async getRangeMetrics(
    @UserId() userId: string,
    @Query() query: RangeMetricsQueryDto,
    @TzOffset() tzOffset: number,
  ) {
    try {
      const totals = await this.waterService.getRangeMetrics(
        userId,
        query.startDate,
        query.endDate,
        tzOffset,
      );
      return { success: true, totals };
    } catch (error) {
      console.error('Get Range Metrics Error:', error);
      throw new HttpException(
        { error: 'Failed to fetch range metrics' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getStatsGraph(
    @UserId() userId: string,
    @Query() query: StatsGraphQueryDto,
    @TzOffset() tzOffset: number,
  ) {
    const data = await this.waterService.getStatsGraph(userId, query.mode, query.refDate, tzOffset);
    return { success: true, data };
  }

  @Get('export')
  async exportUserData(@UserId() userId: string) {
    try {
      const logs = await this.userService.exportUserData(userId);
      return { success: true, logs };
    } catch (error) {
      console.error('Export Data Error:', error);
      throw new HttpException(
        { error: 'No se pudo exportar los datos' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
