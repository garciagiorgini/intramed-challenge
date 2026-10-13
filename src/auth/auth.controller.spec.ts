import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { vi } from 'vitest';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: vi.fn(),
            login: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      const dto: RegisterDto = { email: 'test@example.com', password: 'test' };
      const expectedResult = {
        id: 'user-id',
        email: dto.email,
        role: 'USER' as const,
        createdAt: new Date(),
      };
      vi.spyOn(service, 'register').mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'test' };
      await controller.login(dto);
      expect(service.login).toHaveBeenCalledWith(dto);
    });

    it('should return error when authService.login throws an error', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'test' };
      vi.spyOn(service, 'login').mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(dto)).rejects.toThrow('Invalid credentials');
      expect(service.login).toHaveBeenCalledWith(dto);
    });

    it('should return error when authService.login returns null', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'test' };
      vi.spyOn(service, 'login').mockResolvedValue(null as never);

      await expect(controller.login(dto)).resolves.toBeNull();
    });

    it('must return a JWT token when login is successful', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'test' };
      const mockToken: Awaited<ReturnType<AuthService['login']>> = {
        access_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: '15m',
        user: {
          id: 'user-id',
          email: dto.email,
          role: 'USER',
        },
      };
      vi.spyOn(service, 'login').mockResolvedValue(mockToken);

      const result = await controller.login(dto);
      expect(result).toBe(mockToken);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });
});
