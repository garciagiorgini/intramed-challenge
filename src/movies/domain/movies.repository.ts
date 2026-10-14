import { Movie, Prisma } from '@prisma/client';

export const MOVIE_SORT_FIELDS = [
  'title',
  'episodeId',
  'releaseDate',
  'createdAt',
] as const;

export type MovieSortField = (typeof MOVIE_SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface MovieFilters {
  title?: string;
  director?: string;
  producer?: string;
  episodeId?: number;
  releasedFrom?: Date;
  releasedTo?: Date;
}

export interface FindMoviesParams {
  filters: MovieFilters;
  skip: number;
  take: number;
  sortBy: MovieSortField;
  order: SortOrder;
}

export interface MoviesPage {
  items: Movie[];
  total: number;
}

export interface MoviesRepository {
  findAll(params: FindMoviesParams): Promise<MoviesPage>;
  findById(id: string): Promise<Movie | null>;
  create(data: Prisma.MovieCreateInput): Promise<Movie>;
  update(id: string, data: Prisma.MovieUpdateInput): Promise<Movie>;
  delete(id: string): Promise<Movie>;
  upsertByExternalId(
    externalId: string,
    data: Prisma.MovieCreateInput,
  ): Promise<Movie>;
}

export const MOVIES_REPOSITORY = Symbol('MOVIES_REPOSITORY');
