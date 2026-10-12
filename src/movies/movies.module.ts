import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './application/movies.service';
import { PrismaMoviesRepository } from './infrastructure/prisma-movies.repository';
import { MOVIES_REPOSITORY } from './domain/movies.repository';

@Module({
  controllers: [MoviesController],
  providers: [MoviesService ,PrismaMoviesRepository,{
    provide: MOVIES_REPOSITORY,
    useExisting: PrismaMoviesRepository,
  }],
  exports: [MoviesService, MOVIES_REPOSITORY],
})
export class MoviesModule {}
