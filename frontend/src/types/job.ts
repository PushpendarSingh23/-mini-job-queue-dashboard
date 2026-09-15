export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
}

export interface CreateJobInput {
  title: string;
  type: string;
}

export interface JobStats {
  all: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}
