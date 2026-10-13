import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { USERS_REPOSITORY } from '../domain/users.repository';
import type { UsersRepository } from '../domain/users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, {
        provide: USERS_REPOSITORY,
        useValue: {
          findAll: vi.fn(),
          findByEmail: vi.fn(),
          create: vi.fn(),
        },
      }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(USERS_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should call repository.findByEmail with the correct email and return the result', async () => {
      const mockUser = { id: '1', email: 'user@example.com' };
      vi.spyOn(repository, 'findByEmail').mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('user@example.com');

      expect(repository.findByEmail).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual(mockUser);
    });
  });
});
