import axios from 'axios';
import { Job, JobStatus, CreateJobInput, JobStats } from '../types/job';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchJobs = async (status?: JobStatus): Promise<Job[]> => {
  const params = status ? { status } : {};
  const response = await api.get<Job[]>('/jobs', { params });
  return response.data;
};

export const fetchJobStats = async (): Promise<JobStats> => {
  const response = await api.get<JobStats>('/jobs/stats');
  return response.data;
};

export const createJob = async (input: CreateJobInput): Promise<Job> => {
  const response = await api.post<Job>('/jobs', input);
  return response.data;
};

export const updateJobStatus = async (
  id: string,
  status: JobStatus,
): Promise<Job> => {
  const response = await api.patch<Job>(`/jobs/${id}/status`, { status });
  return response.data;
};

export const deleteJob = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/jobs/${id}`);
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>('/health');
  return response.data;
};
