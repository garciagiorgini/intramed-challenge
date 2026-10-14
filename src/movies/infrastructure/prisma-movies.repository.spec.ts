import { Prisma } from '@prisma/client';
import { vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { FindMoviesParams } from '../domain/movies.repository';
import { PrismaMoviesRepository } from './prisma-movies.repository';

describe('PrismaMoviesRepository', () => {
  let prisma: {
    movie: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let repository: PrismaMoviesRepository;

  const params = (
    overrides: Partial<FindMoviesParams> = {},
  ): FindMoviesParams => ({
    filters: {},
    skip: 0,
    take: 10,
    sortBy: 'title',
    order: 'asc',
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      movie: {
        findMany: vi.fn().mockReturnValue('findMany-query'),
        count: vi.fn().mockReturnValue('count-query'),
      },
      $transaction: vi.fn().mockResolvedValue([[{ id: '1' }], 1]),
    };
    repository = new PrismaMoviesRepository(prisma as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('should run findMany and count in a single transaction', async () => {
      const result = await repository.findAll(params());

      expect(prisma.$transaction).toHaveBeenCalledWith([
        'findMany-query',
        'count-query',
      ]);
      expect(result).toEqual({ items: [{ id: '1' }], total: 1 });
    });

    it('should apply pagination and a stable sort', async () => {
      await repository.findAll(
        params({ skip: 20, take: 5, sortBy: 'releaseDate', order: 'desc' }),
      );

      expect(prisma.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 5,
          orderBy: [{ releaseDate: 'desc' }, { id: 'asc' }],
        }),
      );
    });

    it('should build case-insensitive text filters and the release date range', async () => {
      const releasedFrom = new Date('1977-01-01T00:00:00.000Z');
      const releasedTo = new Date('1983-12-31T00:00:00.000Z');

      await repository.findAll(
        params({
          filters: {
            title: 'hope',
            director: 'lucas',
            episodeId: 4,
            releasedFrom,
            releasedTo,
          },
        }),
      );

      const expectedWhere = {
        title: { contains: 'hope', mode: Prisma.QueryMode.insensitive },
        director: { contains: 'lucas', mode: Prisma.QueryMode.insensitive },
        producer: undefined,
        episodeId: 4,
        releaseDate: { gte: releasedFrom, lte: releasedTo },
      };
      expect(prisma.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere }),
      );
      expect(prisma.movie.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should not filter by release date when no range is given', async () => {
      await repository.findAll(params());

      const { where } = prisma.movie.findMany.mock.calls[0][0];
      expect(where).not.toHaveProperty('releaseDate');
    });
  });
});
