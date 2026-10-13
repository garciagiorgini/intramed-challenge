import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { USERS_REPOSITORY, UsersRepository } from '../users/domain/users.repository';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: UsersRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService,
        {
          provide: USERS_REPOSITORY,
          useValue: {
            findByEmail: vi.fn(),
            create: vi.fn(),
          }
        },
        {
          provide: JwtService,
          useValue: {
            sign: vi.fn(),
          }
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get<UsersRepository>(USERS_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email is already registered', async () => {
      const dto : RegisterDto = { email: 'test@example.com', password: 'test' };
      vi.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce(
        { email: dto.email } as NonNullable<Awaited<ReturnType<UsersRepository['findByEmail']>>>,
      );

      await expect(service.register(dto)).rejects.toThrow('Email already registered');
    });

    it('should create a new user and return user data', async () => {
      const dto : RegisterDto = { email: 'test@example.com', password: 'test' };
      const date = new Date();
      vi.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce(null);
      vi.spyOn(usersRepository, 'create').mockResolvedValueOnce(
        {
          id: 'user-id',
          email: dto.email,
          passwordHash: 'hashed-password',
          role: 'USER',
          createdAt: date,
          updatedAt: date,
        },
      );

      const result = await service.register(dto);
      expect(result).toEqual({ createdAt: date, email: dto.email, id: 'user-id',role: 'USER' });
    });
  });
});
