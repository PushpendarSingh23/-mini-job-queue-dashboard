import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '../enums/job-status.enum';

export class FilterJobDto {
  @IsOptional()
  @IsEnum(JobStatus, {
    message: `status must be one of the following values: ${Object.values(
      JobStatus,
    ).join(', ')}`,
  })
  status?: JobStatus;
}
