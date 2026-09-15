import React from 'react';
import { Job } from '../types/job';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  job: Job | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  job,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-500">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to delete job{' '}
          <span className="font-semibold text-slate-900">"{job.title}"</span>?
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(job.id)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm disabled:opacity-50 transition-colors"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete Job'}
          </button>
        </div>
      </div>
    </div>
  );
};
