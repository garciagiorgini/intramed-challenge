import {
  Injectable,
  BadGatewayException,
  Logger,
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
  private readonly logger = new Logger(SwapiClient.name);

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
      this.logger.log(`Consultando películas desde SWAPI (${baseUrl}/films)...`);
      const response = await firstValueFrom(
        this.http.get<{ result: SwapiFilmResult[] }>(
          `${baseUrl}/films`,
          { timeout: 10_000 },
        ),
      );

      if (!Array.isArray(response.data?.result)) {
        throw new Error('Respuesta de SWAPI no contiene un arreglo de resultados válido');
      }

      this.logger.log(
        `Se obtuvieron exitosamente ${response.data.result.length} películas de SWAPI`,
      );
      return response.data.result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Falló la consulta de películas a SWAPI en ${baseUrl}/films: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadGatewayException(
        `Error al consultar SWAPI: ${message}`,
      );
    }
  }
}