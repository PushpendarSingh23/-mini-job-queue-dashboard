import React from 'react';
import { RotateCw, Plus, Cpu } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onOpenCreateModal,
  isRefreshing,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Mini Job Queue Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Real-time asynchronous task orchestration & monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            title="Refresh jobs and statistics"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>
      </div>
    </header>
  );
};
