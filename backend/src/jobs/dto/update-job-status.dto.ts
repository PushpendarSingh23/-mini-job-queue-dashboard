import { IsEnum, IsNotEmpty } from 'class-validator';
import { JobStatus } from '../enums/job-status.enum';

export class UpdateJobStatusDto {
  @IsNotEmpty({ message: 'status is required' })
  @IsEnum(JobStatus, {
    message: `status must be one of the following values: ${Object.values(
      JobStatus,
    ).join(', ')}`,
  })
  status: JobStatus;
}
