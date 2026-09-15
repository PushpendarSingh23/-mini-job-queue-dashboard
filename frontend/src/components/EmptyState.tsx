import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { JobStatus } from '../types/job';

interface EmptyStateProps {
  filter: JobStatus | 'all';
  onOpenCreateModal: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  filter,
  onOpenCreateModal,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <Inbox className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        No jobs found
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
        {filter === 'all'
          ? 'Your job queue is currently empty. Get started by creating a new job.'
          : `There are currently no jobs with status "${filter}".`}
      </p>
      {filter === 'all' && (
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create First Job
        </button>
      )}
    </div>
  );
};
