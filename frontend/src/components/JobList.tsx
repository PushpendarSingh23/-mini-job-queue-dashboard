import React from 'react';
import { Job, JobStatus } from '../types/job';
import { JobCard } from './JobCard';
import { EmptyState } from './EmptyState';

interface JobListProps {
  jobs: Job[];
  activeFilter: JobStatus | 'all';
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onDeleteRequest: (job: Job) => void;
  updatingJobId: string | null;
  onOpenCreateModal: () => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  activeFilter,
  onUpdateStatus,
  onDeleteRequest,
  updatingJobId,
  onOpenCreateModal,
}) => {
  if (jobs.length === 0) {
    return (
      <EmptyState filter={activeFilter} onOpenCreateModal={onOpenCreateModal} />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onUpdateStatus={onUpdateStatus}
          onDeleteRequest={onDeleteRequest}
          isUpdating={updatingJobId === job.id}
        />
      ))}
    </div>
  );
};
