import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
  ) {}

  /**
   * Create a new job. Initial status is strictly forced to 'pending'.
   */
  async createJob(createJobDto: CreateJobDto): Promise<Job> {
    const job = this.jobsRepository.create({
      title: createJobDto.title,
      type: createJobDto.type,
      status: JobStatus.PENDING,
    });
    return await this.jobsRepository.save(job);
  }

  /**
   * Retrieve all jobs with optional status filter, sorted by newest first.
   */
  async findAllJobs(filterDto: FilterJobDto): Promise<Job[]> {
    const query = this.jobsRepository
      .createQueryBuilder('job')
      .orderBy('job.createdAt', 'DESC');

    if (filterDto.status) {
      query.andWhere('job.status = :status', { status: filterDto.status });
    }

    return await query.getMany();
  }

  /**
   * Retrieve count statistics for all status categories.
   */
  async getJobStats(): Promise<{
    all: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  }> {
    const counts = await this.jobsRepository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(job.id)', 'count')
      .groupBy('job.status')
      .getRawMany<{ status: JobStatus; count: string }>();

    const stats = {
      all: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
    };

    for (const item of counts) {
      const cnt = parseInt(item.count, 10) || 0;
      stats.all += cnt;
      if (item.status === JobStatus.PENDING) stats.pending = cnt;
      else if (item.status === JobStatus.RUNNING) stats.running = cnt;
      else if (item.status === JobStatus.COMPLETED) stats.completed = cnt;
      else if (item.status === JobStatus.FAILED) stats.failed = cnt;
    }

    return stats;
  }

  /**
   * Retrieve a single job by ID.
   */
  async findOneJob(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id });
    if (!job) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }
    return job;
  }

  /**
   * Update job status using an atomic conditional DB update to prevent race conditions.
   * State Machine Rules:
   * - pending -> running, failed
   * - running -> completed, failed
   * - completed -> NONE
   * - failed -> NONE
   */
  async updateJobStatus(id: string, targetStatus: JobStatus): Promise<Job> {
    // 1. Determine allowed source statuses for targetStatus
    let allowedSourceStatuses: JobStatus[] = [];

    switch (targetStatus) {
      case JobStatus.RUNNING:
        allowedSourceStatuses = [JobStatus.PENDING];
        break;
      case JobStatus.COMPLETED:
        allowedSourceStatuses = [JobStatus.RUNNING];
        break;
      case JobStatus.FAILED:
        allowedSourceStatuses = [JobStatus.PENDING, JobStatus.RUNNING];
        break;
      case JobStatus.PENDING:
        throw new BadRequestException(
          `Cannot transition any job status back to "${JobStatus.PENDING}".`,
        );
      default:
        throw new BadRequestException(
          `Invalid target status "${targetStatus}".`,
        );
    }

    // 2. Perform Atomic Conditional UPDATE at Database level
    const updateResult = await this.jobsRepository
      .createQueryBuilder()
      .update(Job)
      .set({ status: targetStatus })
      .where('id = :id AND status IN (:...allowedSourceStatuses)', {
        id,
        allowedSourceStatuses,
      })
      .execute();

    // 3. Evaluate results
    if (updateResult.affected === 1) {
      return await this.findOneJob(id);
    }

    // If 0 rows were updated, investigate why (either job doesn't exist or state mismatch)
    const existingJob = await this.jobsRepository.findOneBy({ id });
    if (!existingJob) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }

    // Job exists, but transition was rejected because existingJob.status was not in allowedSourceStatuses
    throw new ConflictException(
      `Invalid status transition from "${existingJob.status}" to "${targetStatus}". The job may have already been updated by another request.`,
    );
  }

  /**
   * Delete job by ID.
   */
  async deleteJob(id: string): Promise<{ message: string }> {
    const deleteResult = await this.jobsRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Job with ID "${id}" not found`);
    }
    return { message: `Job with ID "${id}" deleted successfully` };
  }
}
