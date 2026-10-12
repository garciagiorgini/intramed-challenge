import {
  Injectable,
  BadGatewayException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface SwapiFilm {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  created?: string;
  edited?: string;
  url?: string;
}

export interface SwapiFilmResult {
  uid: string;
  properties: SwapiFilm;
}

@Injectable()
export class SwapiClient {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async getFilms(): Promise<SwapiFilmResult[]> {
    const baseUrl = this.config.get<string>(
      'SWAPI_BASE_URL',
      'https://www.swapi.tech/api',
    );

    try {
      const response = await firstValueFrom(
        this.http.get<{ result: SwapiFilmResult[] }>(
          `${baseUrl}/films`,
          { timeout: 10_000 },
        ),
      );

      if (!Array.isArray(response.data?.result)) {
        throw new Error('Invalid SWAPI response');
      }

      return response.data.result;
    } catch {
      throw new BadGatewayException(
        'Error al consultar SWAPI',
      );
    }
  }
}