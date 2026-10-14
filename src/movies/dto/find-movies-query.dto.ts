import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  MOVIE_SORT_FIELDS,
  type MovieSortField,
  type SortOrder,
} from '../domain/movies.repository';

export class FindMoviesQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página (empieza en 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Búsqueda parcial por título, sin distinguir mayúsculas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Búsqueda parcial por director, sin distinguir mayúsculas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  director?: string;

  @ApiPropertyOptional({
    description: 'Búsqueda parcial por productor, sin distinguir mayúsculas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  producer?: string;

  @ApiPropertyOptional({ description: 'Número de episodio exacto', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  episodeId?: number;

  @ApiPropertyOptional({
    description: 'Fecha de estreno mínima, inclusive',
    example: '1977-01-01',
  })
  @IsOptional()
  @IsDateString()
  releasedFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha de estreno máxima, inclusive',
    example: '1983-12-31',
  })
  @IsOptional()
  @IsDateString()
  releasedTo?: string;

  @ApiPropertyOptional({
    description: 'Campo por el que se ordena',
    enum: MOVIE_SORT_FIELDS,
    default: 'title',
  })
  @IsOptional()
  @IsIn(MOVIE_SORT_FIELDS)
  sortBy: MovieSortField = 'title';

  @ApiPropertyOptional({
    description: 'Sentido del orden',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: SortOrder = 'asc';
}
