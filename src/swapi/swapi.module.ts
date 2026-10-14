import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SwapiClient } from './swapi.client/swapi.client';
import { SwapiService } from './swapi-sync/swapi-sync.service';
import { SwapiProcessor } from './sync.processor/sync.processor';
import { RolesGuard } from '../common/guards/roles.guard';
import { SwapiSyncController } from './swapi-sync.controller';
import { MoviesModule } from '../movies/movies.module';

@Module({
  imports: [
    HttpModule,
    MoviesModule,
  ],
  controllers: [SwapiSyncController],
  providers: [
    SwapiClient,
    SwapiService,
    SwapiProcessor,
    RolesGuard,
  ],
  exports: [SwapiService],
})
export class SwapiModule {}