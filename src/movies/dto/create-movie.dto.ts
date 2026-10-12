import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  episodeId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  openingCrawl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  director?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  producer?: string;

  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characters?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  planets?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  starships?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  species?: string[];
}