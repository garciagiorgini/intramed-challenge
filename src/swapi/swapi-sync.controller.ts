import { Controller, Logger, Post, UseGuards } from '@nestjs/common';
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
  private readonly logger = new Logger(SwapiSyncController.name);

  constructor(
    private readonly swapiSyncService: SwapiService,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize movies from SWAPI' })
  async sync() {
    this.logger.log('Petición recibida para sincronizar películas desde SWAPI');
    try {
      const result = await this.swapiSyncService.sync();
      this.logger.log(
        `Sincronización finalizada correctamente. Películas procesadas: ${result.processed}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        'Error durante la sincronización de películas desde SWAPI',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}