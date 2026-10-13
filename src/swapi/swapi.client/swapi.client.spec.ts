import { Test, TestingModule } from '@nestjs/testing';
import { SwapiClient } from './swapi.client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { vi } from 'vitest';

describe('SwapiClient', () => {
  let provider: SwapiClient;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwapiClient, {
        provide: HttpService,
        useValue: {
          get: vi.fn(),
        },
      }, {
        provide: ConfigService,
        useValue: {
          get: vi.fn(),
        },
      }],
    }).compile();

    provider = module.get<SwapiClient>(SwapiClient);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
