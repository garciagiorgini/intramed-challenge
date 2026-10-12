import { Test, TestingModule } from '@nestjs/testing';
import { SwapiProcessor } from './sync.processor';

describe('SwapiProcessor', () => {
  let provider: SwapiProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwapiProcessor],
    }).compile();

    provider = module.get<SwapiProcessor>(SwapiProcessor);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
