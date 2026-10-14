import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import request from 'supertest';
import { vi } from 'vitest';

import { MoviesController } from './movies.controller';
import { MoviesService } from './application/movies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;
  let reflector: Reflector;
  let rolesGuard: RolesGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: {
            findAll: vi.fn(),
            findOne: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
        Reflector,
        RolesGuard,
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
    reflector = module.get<Reflector>(Reflector);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call moviesService.findAll', async () => {
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call moviesService.findOne with correct parameters', async () => {
      const id = '1';
      await controller.findOne(id);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
    it('should throw an error if id is not provided', async () => {
      vi.spyOn(service, 'findOne').mockRejectedValue(new Error('Movie not found'));
      await expect(controller.findOne(undefined as any)).rejects.toThrow();
    });
  });
  
  describe('create', () => {
    it('should call moviesService.create with correct parameters', async () => {
      const dto = { title: 'Test Movie', description: 'Test Description' };
      await controller.create(dto as any);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should call moviesService.update with correct parameters', async () => {
      const id = '1';
      const dto = { title: 'Updated Movie', description: 'Updated Description' };
      await controller.update(id, dto as any);
      expect(service.update).toHaveBeenCalledWith(id, dto);
    });
    it('should throw an error if id is not provided', async () => {
      const dto = { title: 'Updated Movie', description: 'Updated Description' };
      vi.spyOn(service, 'update').mockRejectedValue(new Error('Movie not found'));
      await expect(controller.update(undefined as any, dto as any)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should call moviesService.remove with correct parameters', async () => {
      const id = '1';
      await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
    });
    it('should throw an error if id is not provided', async () => {
      vi.spyOn(service, 'remove').mockRejectedValue(new Error('Movie not found'));
      await expect(controller.remove(undefined as any)).rejects.toThrow();
    });
  });

  describe('Restricciones de Roles (Decoradores y RolesGuard)', () => {
    const createMockExecutionContext = (
      handler: Function,
      user?: { email?: string; role?: Role },
    ): ExecutionContext => {
      return {
        getHandler: () => handler,
        getClass: () => MoviesController,
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/movies',
            user,
          }),
          getResponse: vi.fn(),
          getNext: vi.fn(),
        }),
      } as unknown as ExecutionContext;
    };

    describe('GET /movies/:id (Detalle de película)', () => {
      it('debe permitir los roles USER y ADMIN en su metadata', () => {
        const roles = reflector.get<Role[]>(ROLES_KEY, controller.findOne);
        expect(roles).toEqual([Role.USER, Role.ADMIN]);
      });

      it('debe tener asignados los guards JwtAuthGuard y RolesGuard', () => {
        const guards = Reflect.getMetadata('__guards__', controller.findOne);
        expect(guards).toContain(JwtAuthGuard);
        expect(guards).toContain(RolesGuard);
      });

      it('permite el acceso a un USER regular', () => {
        const context = createMockExecutionContext(controller.findOne, {
          email: 'user@example.com',
          role: Role.USER,
        });
        expect(rolesGuard.canActivate(context)).toBe(true);
      });

      it('permite el acceso a un ADMIN', () => {
        const context = createMockExecutionContext(controller.findOne, {
          email: 'admin@example.com',
          role: Role.ADMIN,
        });
        expect(rolesGuard.canActivate(context)).toBe(true);
      });

      it('deniega el acceso (ForbiddenException) si no hay usuario autenticado', () => {
        const context = createMockExecutionContext(controller.findOne, undefined);
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
      });
    });

    describe('POST /movies (Crear nueva película)', () => {
      it('debe tener configurado el rol ADMIN en su metadata', () => {
        const roles = reflector.get<Role[]>(ROLES_KEY, controller.create);
        expect(roles).toEqual([Role.ADMIN]);
      });

      it('debe tener asignados los guards JwtAuthGuard y RolesGuard', () => {
        const guards = Reflect.getMetadata('__guards__', controller.create);
        expect(guards).toContain(JwtAuthGuard);
        expect(guards).toContain(RolesGuard);
      });

      it('permite el acceso si el usuario autenticado tiene rol ADMIN', () => {
        const context = createMockExecutionContext(controller.create, {
          email: 'admin@example.com',
          role: Role.ADMIN,
        });
        expect(rolesGuard.canActivate(context)).toBe(true);
      });

      it('deniega el acceso (ForbiddenException) si el usuario es USER regular', () => {
        const context = createMockExecutionContext(controller.create, {
          email: 'user@example.com',
          role: Role.USER,
        });
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
      });

      it('deniega el acceso (ForbiddenException) si no hay usuario autenticado', () => {
        const context = createMockExecutionContext(controller.create, undefined);
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
      });
    });

    describe('PATCH /movies/:id (Actualizar película existente)', () => {
      it('debe tener configurado el rol ADMIN en su metadata', () => {
        const roles = reflector.get<Role[]>(ROLES_KEY, controller.update);
        expect(roles).toEqual([Role.ADMIN]);
      });

      it('debe tener asignados los guards JwtAuthGuard y RolesGuard', () => {
        const guards = Reflect.getMetadata('__guards__', controller.update);
        expect(guards).toContain(JwtAuthGuard);
        expect(guards).toContain(RolesGuard);
      });

      it('permite el acceso si el usuario autenticado tiene rol ADMIN', () => {
        const context = createMockExecutionContext(controller.update, {
          email: 'admin@example.com',
          role: Role.ADMIN,
        });
        expect(rolesGuard.canActivate(context)).toBe(true);
      });

      it('deniega el acceso (ForbiddenException) si el usuario es USER regular', () => {
        const context = createMockExecutionContext(controller.update, {
          email: 'user@example.com',
          role: Role.USER,
        });
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
      });

      it('deniega el acceso (ForbiddenException) si no hay usuario autenticado', () => {
        const context = createMockExecutionContext(controller.update, undefined);
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
      });
    });

    describe('DELETE /movies/:id (Eliminar película)', () => {
      it('debe tener configurado el rol ADMIN en su metadata', () => {
        const roles = reflector.get<Role[]>(ROLES_KEY, controller.remove);
        expect(roles).toEqual([Role.ADMIN]);
      });

      it('debe tener asignados los guards JwtAuthGuard y RolesGuard', () => {
        const guards = Reflect.getMetadata('__guards__', controller.remove);
        expect(guards).toContain(JwtAuthGuard);
        expect(guards).toContain(RolesGuard);
      });

      it('permite el acceso si el usuario autenticado tiene rol ADMIN', () => {
        const context = createMockExecutionContext(controller.remove, {
          email: 'admin@example.com',
          role: Role.ADMIN,
        });
        expect(rolesGuard.canActivate(context)).toBe(true);
      });

      it('deniega el acceso (ForbiddenException) si el usuario es USER regular', () => {
        const context = createMockExecutionContext(controller.remove, {
          email: 'user@example.com',
          role: Role.USER,
        });
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => rolesGuard.canActivate(context)).toThrow('Insufficient permissions');
      });

      it('deniega el acceso (ForbiddenException) si no hay usuario autenticado', () => {
        const context = createMockExecutionContext(controller.remove, undefined);
        expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
      });
    });
  });

  describe('Verificación HTTP de Roles mediante Supertest', () => {
    let app: INestApplication;
    let currentUser: { email: string; role: Role } | undefined;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [MoviesController],
        providers: [
          {
            provide: MoviesService,
            useValue: {
              findAll: vi.fn().mockResolvedValue([]),
              findOne: vi.fn().mockResolvedValue({ id: '1', title: 'A New Hope' }),
              create: vi.fn().mockResolvedValue({ id: '1', title: 'A New Hope' }),
              update: vi.fn().mockResolvedValue({ id: '1', title: 'Updated Movie' }),
              remove: vi.fn().mockResolvedValue({ id: '1', title: 'Deleted Movie' }),
            },
          },
          Reflector,
          RolesGuard,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            req.user = currentUser;
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /movies/:id: Usuario común puede ver el detalle (200 OK)', async () => {
      currentUser = { email: 'user@example.com', role: Role.USER };

      await request(app.getHttpServer()).get('/movies/1').expect(200);
    });

    it('GET /movies/:id: Administrador puede ver el detalle (200 OK)', async () => {
      currentUser = { email: 'admin@example.com', role: Role.ADMIN };

      await request(app.getHttpServer()).get('/movies/1').expect(200);
    });

    it('POST /movies: Administrador puede crear (201 Created)', async () => {
      currentUser = { email: 'admin@example.com', role: Role.ADMIN };

      await request(app.getHttpServer())
        .post('/movies')
        .send({ title: 'A New Hope' })
        .expect(201);
    });

    it('POST /movies: Usuario común no puede crear (403 Forbidden)', async () => {
      currentUser = { email: 'user@example.com', role: Role.USER };

      const response = await request(app.getHttpServer())
        .post('/movies')
        .send({ title: 'A New Hope' })
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    });

    it('PATCH /movies/:id: Administrador puede actualizar (200 OK)', async () => {
      currentUser = { email: 'admin@example.com', role: Role.ADMIN };

      await request(app.getHttpServer())
        .patch('/movies/1')
        .send({ title: 'Empire Strikes Back' })
        .expect(200);
    });

    it('PATCH /movies/:id: Usuario común no puede actualizar (403 Forbidden)', async () => {
      currentUser = { email: 'user@example.com', role: Role.USER };

      const response = await request(app.getHttpServer())
        .patch('/movies/1')
        .send({ title: 'Empire Strikes Back' })
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    });

    it('DELETE /movies/:id: Administrador puede eliminar (200 OK)', async () => {
      currentUser = { email: 'admin@example.com', role: Role.ADMIN };

      await request(app.getHttpServer())
        .delete('/movies/1')
        .expect(200);
    });

    it('DELETE /movies/:id: Usuario común no puede eliminar (403 Forbidden)', async () => {
      currentUser = { email: 'user@example.com', role: Role.USER };

      const response = await request(app.getHttpServer())
        .delete('/movies/1')
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    });
  });
});
