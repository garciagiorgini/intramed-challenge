import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SwapiFilmResult } from '../swapi.client/swapi.client';

@Injectable()
export class SwapiProcessor {
  process(film: SwapiFilmResult): Prisma.MovieCreateInput {
    const properties = film.properties;

    return {
      externalId: film.uid,
      title: properties.title,
      episodeId: properties.episode_id,
      openingCrawl: properties.opening_crawl,
      director: properties.director,
      producer: properties.producer,
      releaseDate: this.parseDate(properties.release_date),
      characters: properties.characters ?? [],
      planets: properties.planets ?? [],
      starships: properties.starships ?? [],
      vehicles: properties.vehicles ?? [],
      species: properties.species ?? [],
    };
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;

    const date = new Date(`${value}T00:00:00.000Z`);

    return Number.isNaN(date.getTime()) ? undefined : date;
  }
}