/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [JwtModule, EmailQueueModule],
  controllers: [TeamsController],
  providers: [TeamsService, PrismaService],
})
export class TeamsModule {}
