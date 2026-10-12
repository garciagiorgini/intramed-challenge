import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SwapiService } from './swapi-sync/swapi-sync.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/movies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SwapiSyncController {
  constructor(
    private readonly swapiSyncService: SwapiService,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize movies from SWAPI' })
  sync() {
    return this.swapiSyncService.sync();
  }
}