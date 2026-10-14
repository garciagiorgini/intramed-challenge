import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { PrismaService } from './../src/prisma/prisma.service';

// Requiere Postgres y Redis levantados (docker compose up -d) y las migraciones aplicadas.
describe('Movies API (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const adminEmail = `e2e-admin-${suffix}@example.com`;
  const userEmail = `e2e-user-${suffix}@example.com`;
  const password = 'una-clave-segura-123';

  let adminToken: string;
  let userToken: string;
  let movieId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);

    // El registro público siempre crea USER, así que el admin se crea directo en la base.
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await argon2.hash(password),
        role: Role.ADMIN,
      },
    });
  });

  afterAll(async () => {
    if (movieId) {
      await prisma.movie.deleteMany({ where: { id: movieId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, userEmail] } },
    });
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/auth/register crea un usuario con rol USER', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: userEmail, password })
        .expect(201);

      expect(response.body).toMatchObject({ email: userEmail, role: 'USER' });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('POST /api/auth/register rechaza un email duplicado (409)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: userEmail, password })
        .expect(409);
    });

    it('POST /api/auth/register valida el body (400)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'no-es-email', password: 'corta' })
        .expect(400);
    });

    it('POST /api/auth/login rechaza credenciales inválidas (401)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: userEmail, password: 'otra-clave-incorrecta' })
        .expect(401);
    });

    it('POST /api/auth/login devuelve un token para USER y ADMIN', async () => {
      const userLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: userEmail, password })
        .expect(200);
      const adminLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: adminEmail, password })
        .expect(200);

      userToken = userLogin.body.access_token;
      adminToken = adminLogin.body.access_token;

      expect(userToken).toEqual(expect.any(String));
      expect(adminLogin.body.user.role).toBe('ADMIN');
    });
  });

  describe('Movies', () => {
    it('POST /api/movies: USER no puede crear (403)', () => {
      return request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Rogue One' })
        .expect(403);
    });

    it('POST /api/movies: sin token devuelve 401', () => {
      return request(app.getHttpServer())
        .post('/api/movies')
        .send({ title: 'Rogue One' })
        .expect(401);
    });

    it('POST /api/movies: ADMIN puede crear (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Rogue One', releaseDate: '2016-12-16' })
        .expect(201);

      movieId = response.body.id;
      expect(response.body.title).toBe('Rogue One');
    });

    it('GET /api/movies es público', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/movies')
        .expect(200);

      expect(response.body.some((m: { id: string }) => m.id === movieId)).toBe(true);
    });

    it('GET /api/movies/:id: sin token devuelve 401', () => {
      return request(app.getHttpServer())
        .get(`/api/movies/${movieId}`)
        .expect(401);
    });

    it('GET /api/movies/:id: USER y ADMIN pueden ver el detalle', async () => {
      await request(app.getHttpServer())
        .get(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('PATCH /api/movies/:id: USER no puede actualizar (403) y ADMIN sí (200)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ director: 'Gareth Edwards' })
        .expect(403);

      const response = await request(app.getHttpServer())
        .patch(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ director: 'Gareth Edwards' })
        .expect(200);

      expect(response.body.director).toBe('Gareth Edwards');
    });

    it('DELETE /api/movies/:id: USER no puede eliminar (403) y ADMIN sí (200)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Swagger', () => {
    it('GET /api/docs-json expone la documentación', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      expect(response.body.paths).toHaveProperty('/api/movies/{id}');
    });
  });
});
