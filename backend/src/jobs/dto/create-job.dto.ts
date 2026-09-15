import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(255, { message: 'title must not exceed 255 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'type must not be empty' })
  @MaxLength(100, { message: 'type must not exceed 100 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  type: string;
}
