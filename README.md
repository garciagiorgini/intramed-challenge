# Star Wars Movies API

Backend en **NestJS** para gestionar películas. Toma los datos de la API pública de Star Wars ([swapi.tech](https://www.swapi.tech)) y suma autenticación con JWT y autorización por roles (`USER` / `ADMIN`).

Resuelve el challenge [Backend Nest Ssr. Test](https://conexatech.notion.site/Backend-Nest-Ssr-Test-d3fa3d4c614249b2afeac5d8cf98784f).

- **Repositorio:** https://github.com/garciagiorgini/intramed-challenge
- **Documentación Swagger (local):** http://localhost:3000/api/docs

---

## Stack

| Área | Tecnología |
| --- | --- |
| Framework | NestJS 12, TypeScript |
| Base de datos | PostgreSQL 16 + Prisma ORM 6 |
| Auth | `@nestjs/jwt`, Passport (`passport-jwt`), hash de contraseñas con Argon2 |
| Validación | `class-validator` / `class-transformer` (`ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`) |
| Integración externa | `@nestjs/axios` contra `https://www.swapi.tech/api` |
| Documentación | Swagger (`@nestjs/swagger` con el plugin del CLI) |
| Tests | Vitest + Supertest |
| Infra | Docker Compose (Postgres) en local · `Dockerfile` para deploy en Render |

---

## Arquitectura

Cada módulo de dominio separa **aplicación**, **dominio** e **infraestructura**. Los servicios dependen de una interfaz de repositorio que se inyecta por token (`MOVIES_REPOSITORY`, `USERS_REPOSITORY`). La implementación concreta es Prisma, así que se puede reemplazar o mockear sin tocar la lógica de negocio.

```
src/
├── auth/                     # Registro, login, estrategia JWT y JwtAuthGuard
│   ├── dto/                  # RegisterDto, LoginDto
│   ├── guards/
│   └── strategies/
├── common/
│   ├── decorators/           # @Roles(...)
│   └── guards/               # RolesGuard
├── movies/
│   ├── application/          # MoviesService (lógica de negocio)
│   ├── domain/               # Interfaz MoviesRepository + token
│   ├── infrastructure/       # PrismaMoviesRepository
│   ├── dto/
│   └── movies.controller.ts
├── users/                    # Misma estructura: application / domain / infrastructure
├── swapi/
│   ├── swapi.client/         # Cliente HTTP contra SWAPI
│   ├── sync.processor/       # Mapeo SWAPI → modelo Movie
│   ├── swapi-sync/           # Orquesta la sincronización (upsert por externalId)
│   └── swapi-sync.controller.ts
└── prisma/                   # PrismaService / PrismaModule
prisma/
├── schema.prisma
├── migrations/
└── seed.ts                   # Crea o actualiza el usuario ADMIN
```

**Sincronización con SWAPI.** `POST /api/admin/movies/sync` obtiene `/films` de swapi.tech, mapea cada película y hace un *upsert* por `externalId`, el `uid` de SWAPI. Por eso es idempotente: si se ejecuta varias veces, actualiza los registros en lugar de duplicarlos. Si una película falla, el error se registra y el resto sigue procesándose. La respuesta trae el detalle de las fallidas.

---

## Endpoints

Todos los endpoints llevan el prefijo `/api`.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Público | Registra un usuario con rol `USER` |
| `POST` | `/api/auth/login` | Público | Devuelve `access_token` (JWT) |
| `GET` | `/api/movies` | Público | Lista las películas |
| `GET` | `/api/movies/:id` | `USER` o `ADMIN` | Detalle de una película |
| `POST` | `/api/movies` | `ADMIN` | Crea una película |
| `PATCH` | `/api/movies/:id` | `ADMIN` | Actualiza una película |
| `DELETE` | `/api/movies/:id` | `ADMIN` | Elimina una película |
| `POST` | `/api/admin/movies/sync` | `ADMIN` | Sincroniza las películas desde SWAPI |

Códigos de error:

- `400`: validación fallida.
- `401`: sin token o con un token inválido o vencido.
- `403`: el rol no alcanza.
- `404`: la película no existe.
- `409`: el email ya está registrado.
- `502`: falla al consultar SWAPI.

**Reglas de validación**

- Registro: email válido y contraseña de 12 a 128 caracteres. El email se normaliza a minúsculas.
- Película: `title` es obligatorio. `episodeId` (entero ≥ 1), `openingCrawl`, `director`, `producer`, `releaseDate` (ISO `YYYY-MM-DD`) y los arrays `characters`, `planets`, `starships`, `vehicles` y `species` son opcionales.
- Se rechazan los campos que no figuran en el DTO.

La documentación interactiva completa está en **Swagger**: http://localhost:3000/api/docs. Para usar los endpoints protegidos, hacé login, copiá el `access_token` y pegalo en **Authorize**.

---

## Cómo ejecutarlo localmente

### Requisitos

- Node.js 22 o superior
- Docker y Docker Compose

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción | Default |
| --- | --- | --- |
| `DATABASE_URL` | Conexión a Postgres | coincide con `compose.yml` |
| `JWT_SECRET` | Clave de firma del JWT. **Cambiala por un valor largo y aleatorio** | — |
| `JWT_EXPIRES_IN` | Vencimiento del token | `15m` |
| `PORT` | Puerto HTTP | `3000` |
| `SWAPI_BASE_URL` | URL base de SWAPI (opcional) | `https://www.swapi.tech/api` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del admin que crea el seed | — |

### 3. Levantar Postgres

```bash
docker compose up -d
```

### 4. Migraciones y usuario administrador

```bash
npx prisma migrate deploy   # aplica las migraciones
npx prisma generate         # genera el cliente de Prisma
npx tsx prisma/seed.ts      # crea o actualiza el usuario ADMIN definido en .env
```

> Los usuarios que se registran por `/api/auth/register` siempre reciben el rol `USER`. El único `ADMIN` es el que crea el seed.

### 5. Iniciar la API

```bash
npm run start:dev     # modo watch
# o
npm run build && npm run start:prod
```

La API queda en `http://localhost:3000/api` y Swagger en `http://localhost:3000/api/docs`.

---

## Probar el flujo completo

```bash
# 1. Registrar un usuario común
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@example.com","password":"una-clave-segura-123"}'

# 2. Login como admin (credenciales del .env)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"una-clave-local-segura"}' | jq -r .access_token)

# 3. Sincronizar películas desde SWAPI
curl -X POST http://localhost:3000/api/admin/movies/sync \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 4. Listar películas (público)
curl http://localhost:3000/api/movies

# 5. Login como usuario común y ver el detalle
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@example.com","password":"una-clave-segura-123"}' | jq -r .access_token)

curl http://localhost:3000/api/movies/<MOVIE_ID> -H "Authorization: Bearer $USER_TOKEN"

# 6. Un usuario común no puede crear → 403
curl -X POST http://localhost:3000/api/movies \
  -H "Authorization: Bearer $USER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Rogue One"}'

# 7. El admin sí puede crear → 201
curl -X POST http://localhost:3000/api/movies \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Rogue One","director":"Gareth Edwards","releaseDate":"2016-12-16"}'
```

En [curls.txt](curls.txt) hay más ejemplos.

---

## Tests

```bash
npm run test       # tests unitarios (Vitest)
npm run test:cov   # tests con reporte de cobertura en ./coverage
npm run test:e2e   # tests end-to-end (requieren Postgres levantado y las migraciones aplicadas)
```

### Unitarios

No necesitan base de datos porque los repositorios y el cliente HTTP se mockean. Cubren:

- **Auth:** registro (email duplicado, normalización, hash) y login (credenciales inválidas, emisión del token).
- **Movies:**
  - Lógica del servicio: creación, actualización parcial, `404`, conversión de fechas.
  - Controlador.
  - **Restricción de acceso:**
    - Metadata de `@Roles` y de los guards.
    - Comportamiento de `RolesGuard`.
    - Pruebas HTTP con Supertest que verifican `201`/`200` para `ADMIN` y `403` para `USER`.
- **SWAPI:** cliente HTTP (respuestas válidas, inválidas y errores → `502`), mapeo de datos y sincronización con errores parciales.
- **Users y Prisma:** servicios y repositorios.

### End-to-end

[test/app.e2e-spec.ts](test/app.e2e-spec.ts) levanta la aplicación completa contra la base real y recorre el flujo:

- Registro, email duplicado (`409`), validación (`400`) y login (`401` y token).
- CRUD de películas con tokens de `USER` y `ADMIN`: verifica `401`, `403`, `200`/`201` y `404` después de borrar.
- Que Swagger exponga la documentación.

Crea su propio admin y usuario con emails únicos y los borra al terminar, así no ensucia los datos locales.

---

## Deploy en Render

El [Dockerfile](Dockerfile) tiene dos etapas:

- **Build:** genera el cliente de Prisma, compila la API y compila `prisma/seed.ts`.
- **Runtime:** instala solo las dependencias de producción.

Al arrancar, el contenedor:

1. Aplica las migraciones (`prisma migrate deploy`).
2. Si `ADMIN_EMAIL` está definida, crea o actualiza el usuario `ADMIN`.
3. Inicia la API en el puerto que indique `PORT` (Render la define automáticamente).

### Pasos

1. Crear una base **PostgreSQL** en Render y copiar su *Internal Database URL*.
2. Crear un **Web Service** desde el repositorio, rama `deploy`, con runtime **Docker**.
3. Cargar las variables de entorno:

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | La *Internal Database URL* del paso 1 |
   | `JWT_SECRET` | Un valor largo y aleatorio |
   | `JWT_EXPIRES_IN` | Opcional, por defecto `15m` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del administrador |

4. Deployar. Swagger queda en `https://<servicio>.onrender.com/api/docs`.

> En el plan gratuito de Render el servicio se duerme cuando no tiene tráfico, así que el primer request después de un rato puede tardar unos segundos.

Para probar la imagen en local, con el Postgres de `compose.yml`:

```bash
docker build -t intramed-api .
docker run --rm --network host -e PORT=3000 \
  -e DATABASE_URL="postgresql://starwars:local_dev_password@localhost:5432/starwars?schema=public" \
  -e JWT_SECRET=un-secreto-local \
  -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=una-clave-local-segura \
  intramed-api
```

---

## Decisiones de diseño

- **Patrón Repository con inyección por token.** Desacopla la lógica de negocio de Prisma y permite testear los servicios sin base de datos.
- **Argon2** para el hash de contraseñas. El login devuelve el mismo error para "usuario inexistente" y "contraseña incorrecta", así no se puede averiguar qué emails están registrados.
- **`GET /movies/:id` para `USER` y `ADMIN`.** La consigna pide que el detalle sea para "Usuarios Regulares". Se interpretó como "usuarios logueados" y se permite también al administrador, porque sería raro que el admin pudiera editar o borrar una película pero no verla. El endpoint declara los dos roles con `@Roles(Role.USER, Role.ADMIN)`, así que quitar el acceso del admin es un cambio de una línea.
- **Roles desde el JWT.** `JwtStrategy` pone `{ userId, email, role }` en `request.user` y `RolesGuard` lo compara con la metadata de `@Roles(...)`. Los accesos denegados quedan registrados en el log.
- **Sincronización idempotente** por `externalId`, el `uid` de SWAPI. Las películas creadas a mano tienen `externalId = null` y la sincronización no las toca.
- **Sincronización por endpoint y no por cron.** La consigna permite cualquiera de las dos. Con un endpoint, el administrador decide cuándo sincronizar.
