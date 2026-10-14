import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CreateMovieDto } from '../dto/create-movie.dto';
import { FindMoviesQueryDto } from '../dto/find-movies-query.dto';
import { UpdateMovieDto } from '../dto/update-movie.dto';
import {
  MOVIES_REPOSITORY,
  type MoviesRepository,
} from '../domain/movies.repository';
@Injectable()
export class MoviesService {
 constructor(
  @Inject(MOVIES_REPOSITORY)
  private readonly moviesRepository: MoviesRepository,
) {}

  async create(dto: CreateMovieDto) {
    const movieData: Prisma.MovieCreateInput = {
      title: dto.title,
      episodeId: dto.episodeId,
      openingCrawl: dto.openingCrawl,
      director: dto.director,
      producer: dto.producer,
      releaseDate: dto.releaseDate
        ? new Date(`${dto.releaseDate}T00:00:00.000Z`)
        : undefined,
      characters: dto.characters ?? [],
      planets: dto.planets ?? [],
      starships: dto.starships ?? [],
      vehicles: dto.vehicles ?? [],
      species: dto.species ?? [],
    };

    return this.moviesRepository.create(movieData);
  }

  async update(id: string, dto: UpdateMovieDto) {
    const existingMovie = await this.moviesRepository.findById(id);

    if (!existingMovie) {
      throw new NotFoundException('Movie not found');
    }

    const data = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.episodeId !== undefined && {
        episodeId: dto.episodeId,
      }),
      ...(dto.openingCrawl !== undefined && {
        openingCrawl: dto.openingCrawl,
      }),
      ...(dto.director !== undefined && {
        director: dto.director,
      }),
      ...(dto.producer !== undefined && {
        producer: dto.producer,
      }),
      ...(dto.releaseDate !== undefined && {
        releaseDate: dto.releaseDate
          ? new Date(`${dto.releaseDate}T00:00:00.000Z`)
          : null,
      }),
      ...(dto.characters !== undefined && {
        characters: dto.characters,
      }),
      ...(dto.planets !== undefined && { planets: dto.planets }),
      ...(dto.starships !== undefined && {
        starships: dto.starships,
      }),
      ...(dto.vehicles !== undefined && { vehicles: dto.vehicles }),
      ...(dto.species !== undefined && { species: dto.species }),
    };

    return this.moviesRepository.update(id, data);
  }

  async findAll(query: FindMoviesQueryDto) {
    const { page, limit } = query;

    const { items, total } = await this.moviesRepository.findAll({
      filters: {
        title: query.title?.trim() || undefined,
        director: query.director?.trim() || undefined,
        producer: query.producer?.trim() || undefined,
        episodeId: query.episodeId,
        releasedFrom: query.releasedFrom
          ? new Date(`${query.releasedFrom}T00:00:00.000Z`)
          : undefined,
        releasedTo: query.releasedTo
          ? new Date(`${query.releasedTo}T00:00:00.000Z`)
          : undefined,
      },
      skip: (page - 1) * limit,
      take: limit,
      sortBy: query.sortBy,
      order: query.order,
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const movie = await this.moviesRepository.findById(id);

    if (!movie) {
      throw new NotFoundException('Movie not found');
    }

    return movie;
  }

  async findOne(id: string) {
    return this.findById(id);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.moviesRepository.delete(id);
  }
}