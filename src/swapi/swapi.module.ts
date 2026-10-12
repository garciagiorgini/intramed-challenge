import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { SwapiClient } from './swapi.client/swapi.client';
import { SwapiSyncService } from './swapi-sync/swapi-sync.service';
import { SyncProcessor } from './sync.processor/sync.processor';

@Module({
  imports: [
    HttpModule,
    BullModule.registerQueue({ name: 'swapi-sync' }),
  ],
  providers: [
    SwapiClient,
    SwapiSyncService,
    SyncProcessor,
  ],
  exports: [SwapiSyncService],
})
export class SwapiModule {}