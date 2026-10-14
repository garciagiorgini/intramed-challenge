import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { SwapiService } from './swapi-sync.service';
import { SwapiClient, SwapiFilmResult } from '../swapi.client/swapi.client';
import { SwapiProcessor } from '../sync.processor/sync.processor';
import { MOVIES_REPOSITORY } from '../../movies/domain/movies.repository';

describe('SwapiService', () => {
  let service: SwapiService;
  let swapiClient: { getFilms: ReturnType<typeof vi.fn> };
  let moviesRepository: { upsertByExternalId: ReturnType<typeof vi.fn> };

  const film = (uid: string, title: string) =>
    ({ uid, properties: { title } }) as SwapiFilmResult;

  beforeEach(async () => {
    swapiClient = { getFilms: vi.fn() };
    moviesRepository = { upsertByExternalId: vi.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapiService,
        { provide: SwapiClient, useValue: swapiClient },
        {
          provide: SwapiProcessor,
          useValue: {
            process: vi.fn((f: SwapiFilmResult) => ({
              externalId: f.uid,
              title: f.properties.title,
            })),
          },
        },
        { provide: MOVIES_REPOSITORY, useValue: moviesRepository },
      ],
    }).compile();

    service = module.get<SwapiService>(SwapiService);
  });

  it('should upsert every film keeping externalId in the data', async () => {
    swapiClient.getFilms.mockResolvedValue([
      film('1', 'A New Hope'),
      film('2', 'Empire'),
    ]);

    const result = await service.sync();

    expect(moviesRepository.upsertByExternalId).toHaveBeenCalledTimes(2);
    expect(moviesRepository.upsertByExternalId).toHaveBeenCalledWith('1', {
      externalId: '1',
      title: 'A New Hope',
    });
    expect(result).toEqual({
      message: 'Sincronización completada',
      total: 2,
      processed: 2,
    });
  });

  it('should keep going when a film fails and report it', async () => {
    swapiClient.getFilms.mockResolvedValue([
      film('1', 'A New Hope'),
      film('2', 'Empire'),
    ]);
    moviesRepository.upsertByExternalId
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce({});

    const result = await service.sync();

    expect(result).toEqual({
      message: 'Sincronización completada',
      total: 2,
      processed: 1,
      errors: [{ uid: '1', title: 'A New Hope', error: 'db down' }],
    });
  });

  it('should propagate errors from the SWAPI client', async () => {
    swapiClient.getFilms.mockRejectedValue(new Error('SWAPI unavailable'));

    await expect(service.sync()).rejects.toThrow('SWAPI unavailable');
    expect(moviesRepository.upsertByExternalId).not.toHaveBeenCalled();
  });
});
