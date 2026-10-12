import { Injectable } from '@nestjs/common';
import { SwapiClient } from '../swapi.client/swapi.client';
import { SwapiProcessor } from '../sync.processor/sync.processor';
import {
  MOVIES_REPOSITORY} from '../../movies/domain/movies.repository';
import type { MoviesRepository as MoviesRepositoryType } from '../../movies/domain/movies.repository';
import { Inject } from '@nestjs/common';

@Injectable()
export class SwapiService {
  constructor(
    private readonly swapiClient: SwapiClient,
    private readonly processor: SwapiProcessor,
    @Inject(MOVIES_REPOSITORY)
    private readonly moviesRepository: MoviesRepositoryType,
  ) {}

  async sync() {
    const films = await this.swapiClient.getFilms();
    let processed = 0;

    for (const film of films) {
      const movieData = this.processor.process(film);

      const { externalId, ...data } = movieData;

      await this.moviesRepository.upsertByExternalId(
        externalId as string,
        data,
      );

      processed++;
    }

    return {
      message: 'Sincronización completada',
      processed,
    };
  }
}