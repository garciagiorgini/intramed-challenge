import { Test, TestingModule } from '@nestjs/testing';
import { SwapiClient } from './swapi.client';

describe('SwapiClient', () => {
  let provider: SwapiClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwapiClient],
    }).compile();

    provider = module.get<SwapiClient>(SwapiClient);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
