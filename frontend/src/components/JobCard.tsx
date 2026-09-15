import React from 'react';
import { Job, JobStatus } from '../types/job';
import { StatusBadge } from './StatusBadge';
import { Play, CheckCircle, XCircle, Trash2, Calendar, Tag } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onDeleteRequest: (job: Job) => void;
  isUpdating: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onUpdateStatus,
  onDeleteRequest,
  isUpdating,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
            {job.title}
          </h3>
          <StatusBadge status={job.status} />
        </div>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mb-3">
          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
            <Tag className="w-3 h-3 text-slate-400" />
            {job.type}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(job.createdAt)}
          </span>
        </div>

        <div className="text-xs text-slate-400 font-mono select-all">
          ID: {job.id}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {job.status === JobStatus.PENDING && (
            <>
              <button
                onClick={() => onUpdateStatus(job.id, JobStatus.RUNNING)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Start
              </button>
              <button
                onClick={() => onUpdateStatus(job.id, JobStatus.FAILED)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Fail
              </button>
            </>
          )}

          {job.status === JobStatus.RUNNING && (
            <>
              <button
                onClick={() => onUpdateStatus(job.id, JobStatus.COMPLETED)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Complete
              </button>
              <button
                onClick={() => onUpdateStatus(job.id, JobStatus.FAILED)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Fail
              </button>
            </>
          )}

          {(job.status === JobStatus.COMPLETED ||
            job.status === JobStatus.FAILED) && (
            <span className="text-xs text-slate-400 italic">
              Terminal state reached
            </span>
          )}
        </div>

        <button
          onClick={() => onDeleteRequest(job)}
          disabled={isUpdating}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
          title="Delete Job"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
