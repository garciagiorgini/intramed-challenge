import { Movie, Prisma } from '@prisma/client';

export interface MoviesRepository {
  findAll(): Promise<Movie[]>;
  findById(id: string): Promise<Movie | null>;
  create(data: Prisma.MovieCreateInput): Promise<Movie>;
  update(
    id: string,
    data: Prisma.MovieUpdateInput,
  ): Promise<Movie>;
  delete(id: string): Promise<Movie>;
  upsertByExternalId(
    externalId: string,
    data: Prisma.MovieCreateInput,
  ): Promise<Movie>;
}

export const MOVIES_REPOSITORY = Symbol('MOVIES_REPOSITORY');