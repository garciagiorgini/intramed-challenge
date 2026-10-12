import { Injectable, Logger } from '@nestjs/common';
import { SwapiClient } from '../swapi.client/swapi.client';
import { SwapiProcessor } from '../sync.processor/sync.processor';
import {
  MOVIES_REPOSITORY} from '../../movies/domain/movies.repository';
import type { MoviesRepository as MoviesRepositoryType } from '../../movies/domain/movies.repository';
import { Inject } from '@nestjs/common';

@Injectable()
export class SwapiService {
  
  private readonly logger = new Logger(SwapiService.name);
  
  constructor(
    private readonly swapiClient: SwapiClient,
    private readonly processor: SwapiProcessor,
    @Inject(MOVIES_REPOSITORY)
    private readonly moviesRepository: MoviesRepositoryType,
  ) {}

  async sync() {
    this.logger.log('Iniciando sincronización de películas con SWAPI...');
    const films = await this.swapiClient.getFilms();
    let processed = 0;
    const errors: Array<{ uid: string; title: string; error: string }> = [];

    for (const film of films) {
      const title = film.properties?.title ?? `UID: ${film.uid}`;
      try {
        this.logger.log(`Procesando película: "${title}" (UID SWAPI: ${film.uid})`);
        const movieData = this.processor.process(film);

        const { externalId, ...data } = movieData;

        await this.moviesRepository.upsertByExternalId(
          externalId as string,
          data,
        );

        processed++;
        this.logger.log(`Película "${title}" sincronizada correctamente.`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Error al sincronizar película "${title}" (UID: ${film.uid}): ${errorMessage}`,
          err instanceof Error ? err.stack : undefined,
        );
        errors.push({
          uid: film.uid,
          title,
          error: errorMessage,
        });
      }
    }

    this.logger.log(
      `Sincronización finalizada. Películas totales: ${films.length}. Procesadas con éxito: ${processed}. Fallidas: ${errors.length}.`,
    );

    return {
      message: 'Sincronización completada',
      total: films.length,
      processed,
      ...(errors.length > 0 && { errors }),
    };
  }
}