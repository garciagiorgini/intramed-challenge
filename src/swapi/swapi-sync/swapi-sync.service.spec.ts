import { Test, TestingModule } from '@nestjs/testing';
import { SwapiSyncService } from './swapi-sync.service';

describe('SwapiSyncService', () => {
  let service: SwapiSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwapiSyncService],
    }).compile();

    service = module.get<SwapiSyncService>(SwapiSyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
