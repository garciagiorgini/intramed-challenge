import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from '../application/movies.service';
import { MOVIES_REPOSITORY, MoviesRepository } from '../domain/movies.repository';
import { vi } from 'vitest';

describe('MoviesService', () => {
  let service: MoviesService;
  let repository: MoviesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MoviesService, {
        provide: MOVIES_REPOSITORY,
        useValue: {
          findAll: vi.fn(),
          findById: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          upsertByExternalId: vi.fn(),
        },
      }],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    repository = module.get<MoviesRepository>(MOVIES_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call repository.findAll and return the result', async () => {
      const mockMovies = [{ id: '1', title: 'Movie 1' }, { id: '2', title: 'Movie 2' }];
      vi.spyOn(repository, 'findAll').mockResolvedValue(mockMovies as any);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockMovies);
    });
  });

  describe('findById', () => {
    it('should call repository.findById with the correct id and return the result', async () => {
      const mockMovie = { id: '1', title: 'Movie 1' };
      vi.spyOn(repository, 'findById').mockResolvedValue(mockMovie as any);

      const result = await service.findById('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockMovie);
    });
  });

  describe('create', () => {
    it('should call repository.create with the correct data and return the result', async () => {
      const dto = { title: 'New Movie', episodeId: 1, openingCrawl: '...', director: 'Director', producer: 'Producer', releaseDate: '2023-01-01' };
      const mockMovie = { id: '1', ...dto };
      vi.spyOn(repository, 'create').mockResolvedValue(mockMovie as any);

      const result = await service.create(dto as any);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        title: dto.title,
        episodeId: dto.episodeId,
        openingCrawl: dto.openingCrawl,
        director: dto.director,
        producer: dto.producer,
        releaseDate: new Date(`${dto.releaseDate}T00:00:00.000Z`),
      }));
      expect(result).toEqual(mockMovie);
    });
  });

  describe('update', () => {
    it('should call repository.update with the correct id and data and return the result', async () => {
      const dto = { title: 'Updated Movie' };
      const mockMovie = { id: '1', title: 'Updated Movie' };
      vi.spyOn(repository, 'findById').mockResolvedValue(mockMovie as any);
      vi.spyOn(repository, 'update').mockResolvedValue(mockMovie as any);

      const result = await service.update('1', dto as any);

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(repository.update).toHaveBeenCalledWith('1', expect.objectContaining({
        title: dto.title,
      }));
      expect(result).toEqual(mockMovie);
    });
  }); 

  describe('remove', () => {
    it('should call repository.delete with the correct id and return the result', async () => {
      const mockMovie = { id: '1', title: 'Movie 1' };
      vi.spyOn(repository, 'findById').mockResolvedValue(mockMovie as any);
      vi.spyOn(repository, 'delete').mockResolvedValue(mockMovie as any);

      const result = await service.remove('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockMovie);
    });
  }); 
});
