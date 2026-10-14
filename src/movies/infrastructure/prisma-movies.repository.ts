import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  FindMoviesParams,
  MovieFilters,
  MoviesPage,
  MoviesRepository,
} from '../domain/movies.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaMoviesRepository implements MoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
    filters,
    skip,
    take,
    sortBy,
    order,
  }: FindMoviesParams): Promise<MoviesPage> {
    const where = this.buildWhere(filters);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.movie.findMany({
        where,
        skip,
        take,
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [sortBy]: order }, { id: 'asc' }],
      }),
      this.prisma.movie.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.movie.findUnique({ where: { id } });
  }

  create(data: Prisma.MovieCreateInput) {
    return this.prisma.movie.create({ data });
  }

  update(id: string, data: Prisma.MovieUpdateInput) {
    return this.prisma.movie.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return this.prisma.movie.delete({ where: { id } });
  }

  upsertByExternalId(externalId: string, data: Prisma.MovieCreateInput) {
    return this.prisma.movie.upsert({
      where: { externalId },
      create: data,
      update: data,
    });
  }

  private buildWhere(filters: MovieFilters): Prisma.MovieWhereInput {
    const contains = (value?: string) =>
      value
        ? { contains: value, mode: Prisma.QueryMode.insensitive }
        : undefined;

    return {
      title: contains(filters.title),
      director: contains(filters.director),
      producer: contains(filters.producer),
      episodeId: filters.episodeId,
      ...((filters.releasedFrom || filters.releasedTo) && {
        releaseDate: {
          gte: filters.releasedFrom,
          lte: filters.releasedTo,
        },
      }),
    };
  }
}
