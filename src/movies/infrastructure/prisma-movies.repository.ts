import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MoviesRepository } from '../domain/movies.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaMoviesRepository implements MoviesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.movie.findMany({
      orderBy: { title: 'asc' },
    });
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

  upsertByExternalId(
    externalId: string,
    data: Prisma.MovieCreateInput,
  ) {
    return this.prisma.movie.upsert({
      where: { externalId },
      create: data,
      update: data,
    });
  }
}