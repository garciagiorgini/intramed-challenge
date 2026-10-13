import { Test, TestingModule } from '@nestjs/testing';
import { SwapiService } from './swapi-sync.service';
import { SwapiClient } from '../swapi.client/swapi.client';
import { SwapiProcessor } from '../sync.processor/sync.processor';
import { MOVIES_REPOSITORY } from '../../movies/domain/movies.repository';
import type { MoviesRepository as MoviesRepositoryType } from '../../movies/domain/movies.repository';
import { Inject } from '@nestjs/common';

describe('SwapiService', () => {
  let service: SwapiService;
  let swapiClient: SwapiClient;
  let swapiProcessor: SwapiProcessor;
  let moviesRepository: MoviesRepositoryType;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SwapiService, {
        provide: SwapiClient,
        useValue: {
          get: vi.fn(),
        },
      }, {
        provide: SwapiProcessor,
        useValue: {
          process: vi.fn(),
        },
      }, {
        provide: MOVIES_REPOSITORY,
        useValue: {
          create: vi.fn(),
        },
      }],
    }).compile();

    service = module.get<SwapiService>(SwapiService);
    swapiClient = module.get<SwapiClient>(SwapiClient);
    swapiProcessor = module.get<SwapiProcessor>(SwapiProcessor);
    moviesRepository = module.get<MoviesRepositoryType>(MOVIES_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
