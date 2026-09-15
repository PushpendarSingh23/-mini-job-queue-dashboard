import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';

describe('JobsService', () => {
  let service: JobsService;
  let mockJobStore: Map<string, Job>;
  let idCounter: number;

  beforeEach(async () => {
    mockJobStore = new Map<string, Job>();
    idCounter = 1;

    const mockQueryBuilder: any = {
      targetStatus: null,
      allowedStatuses: [] as JobStatus[],
      targetId: null as string | null,
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockImplementation(function (this: any, setValues: any) {
        this.targetStatus = setValues.status;
        return this;
      }),
      where: jest.fn().mockImplementation(function (
        this: any,
        whereClause: string,
        params: any,
      ) {
        this.targetId = params.id;
        this.allowedStatuses = params.allowedSourceStatuses;
        return this;
      }),
      execute: jest.fn().mockImplementation(async function (this: any) {
        let affected = 0;
        const job = mockJobStore.get(this.targetId);
        if (job && this.allowedStatuses.includes(job.status)) {
          job.status = this.targetStatus;
          affected = 1;
        }
        return { affected };
      }),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockImplementation(async () => {
        return Array.from(mockJobStore.values()).sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      }),
      getRawMany: jest.fn().mockImplementation(async () => {
        const counts: Record<string, number> = {};
        for (const job of mockJobStore.values()) {
          counts[job.status] = (counts[job.status] || 0) + 1;
        }
        return Object.entries(counts).map(([status, count]) => ({
          status,
          count: count.toString(),
        }));
      }),
    };

    const mockRepository = {
      create: jest.fn().mockImplementation((dto) => ({
        id: `uuid-job-${idCounter++}`,
        status: JobStatus.PENDING,
        createdAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (job) => {
        mockJobStore.set(job.id, { ...job });
        return mockJobStore.get(job.id);
      }),
      findOneBy: jest.fn().mockImplementation(async (where) => {
        return mockJobStore.get(where.id) || null;
      }),
      delete: jest.fn().mockImplementation(async (id) => {
        const exists = mockJobStore.has(id);
        if (exists) {
          mockJobStore.delete(id);
          return { affected: 1 };
        }
        return { affected: 0 };
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createJob', () => {
    it('should create a job with initial status PENDING', async () => {
      const dto = { title: 'Process Resume', type: 'resume-processing' };
      const job = await service.createJob(dto);

      expect(job).toBeDefined();
      expect(job.title).toBe('Process Resume');
      expect(job.type).toBe('resume-processing');
      expect(job.status).toBe(JobStatus.PENDING);
      expect(mockJobStore.has(job.id)).toBe(true);
    });
  });

  describe('findAllJobs', () => {
    it('should return all jobs', async () => {
      await service.createJob({ title: 'Job 1', type: 'type-1' });
      await service.createJob({ title: 'Job 2', type: 'type-2' });

      const jobs = await service.findAllJobs({});
      expect(jobs.length).toBe(2);
    });
  });

  describe('State Machine & Transitions', () => {
    let testJob: Job;

    beforeEach(async () => {
      testJob = await service.createJob({
        title: 'Test Job',
        type: 'test-type',
      });
    });

    it('should allow pending -> running', async () => {
      const updated = await service.updateJobStatus(
        testJob.id,
        JobStatus.RUNNING,
      );
      expect(updated.status).toBe(JobStatus.RUNNING);
    });

    it('should allow pending -> failed', async () => {
      const updated = await service.updateJobStatus(
        testJob.id,
        JobStatus.FAILED,
      );
      expect(updated.status).toBe(JobStatus.FAILED);
    });

    it('should allow running -> completed', async () => {
      await service.updateJobStatus(testJob.id, JobStatus.RUNNING);
      const updated = await service.updateJobStatus(
        testJob.id,
        JobStatus.COMPLETED,
      );
      expect(updated.status).toBe(JobStatus.COMPLETED);
    });

    it('should allow running -> failed', async () => {
      await service.updateJobStatus(testJob.id, JobStatus.RUNNING);
      const updated = await service.updateJobStatus(
        testJob.id,
        JobStatus.FAILED,
      );
      expect(updated.status).toBe(JobStatus.FAILED);
    });

    it('should reject pending -> completed', async () => {
      await expect(
        service.updateJobStatus(testJob.id, JobStatus.COMPLETED),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject completed -> running (completed cannot transition)', async () => {
      await service.updateJobStatus(testJob.id, JobStatus.RUNNING);
      await service.updateJobStatus(testJob.id, JobStatus.COMPLETED);

      await expect(
        service.updateJobStatus(testJob.id, JobStatus.RUNNING),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject failed -> running (failed cannot transition)', async () => {
      await service.updateJobStatus(testJob.id, JobStatus.FAILED);

      await expect(
        service.updateJobStatus(testJob.id, JobStatus.RUNNING),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject transition back to pending', async () => {
      await service.updateJobStatus(testJob.id, JobStatus.RUNNING);

      await expect(
        service.updateJobStatus(testJob.id, JobStatus.PENDING),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if job does not exist', async () => {
      await expect(
        service.updateJobStatus('non-existent-id', JobStatus.RUNNING),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Concurrency & Atomic Conditional Update', () => {
    it('should handle simulated concurrent status updates where only one succeeds', async () => {
      const job = await service.createJob({
        title: 'Concurrent Job',
        type: 'concurrency-test',
      });

      // Request 1: pending -> running
      const result1 = await service.updateJobStatus(
        job.id,
        JobStatus.RUNNING,
      );
      expect(result1.status).toBe(JobStatus.RUNNING);

      // Request 2 (arriving concurrently or right after): pending -> running on the same job
      // Because job.status is now RUNNING, affected will be 0 and throw ConflictException
      await expect(
        service.updateJobStatus(job.id, JobStatus.RUNNING),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteJob', () => {
    it('should delete an existing job', async () => {
      const job = await service.createJob({ title: 'To Delete', type: 'delete' });
      const res = await service.deleteJob(job.id);
      expect(res.message).toBeDefined();
      expect(mockJobStore.has(job.id)).toBe(false);
    });

    it('should throw NotFoundException when deleting non-existent job', async () => {
      await expect(service.deleteJob('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
