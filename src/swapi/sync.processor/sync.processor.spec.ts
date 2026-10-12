import { Test, TestingModule } from '@nestjs/testing';
import { SyncProcessor } from './sync.processor';

describe('SyncProcessor', () => {
  let provider: SyncProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncProcessor],
    }).compile();

    provider = module.get<SyncProcessor>(SyncProcessor);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
