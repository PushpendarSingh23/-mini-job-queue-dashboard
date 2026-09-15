import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { Job } from './entities/job.entity';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createJob(@Body() createJobDto: CreateJobDto): Promise<Job> {
    return await this.jobsService.createJob(createJobDto);
  }

  @Get()
  async findAllJobs(@Query() filterDto: FilterJobDto): Promise<Job[]> {
    return await this.jobsService.findAllJobs(filterDto);
  }

  @Get('stats')
  async getJobStats(): Promise<{
    all: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    return await this.jobsService.getJobStats();
  }

  @Get(':id')
  async findOneJob(@Param('id', ParseUUIDPipe) id: string): Promise<Job> {
    return await this.jobsService.findOneJob(id);
  }

  @Patch(':id/status')
  async updateJobStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJobStatusDto: UpdateJobStatusDto,
  ): Promise<Job> {
    return await this.jobsService.updateJobStatus(
      id,
      updateJobStatusDto.status,
    );
  }

  @Delete(':id')
  async deleteJob(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return await this.jobsService.deleteJob(id);
  }
}
