import React from 'react';
import { JobStatus, JobStats } from '../types/job';
import { Layers, Clock, Play, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatsOverviewProps {
  stats: JobStats;
  activeFilter: JobStatus | 'all';
  onSelectFilter: (filter: JobStatus | 'all') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'all' as const,
      label: 'All Jobs',
      count: stats.all,
      icon: Layers,
      color: 'text-slate-600 bg-slate-100',
      activeBorder: 'border-indigo-600 ring-2 ring-indigo-600/20',
    },
    {
      id: JobStatus.PENDING,
      label: 'Pending',
      count: stats.pending,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
    },
    {
      id: JobStatus.RUNNING,
      label: 'Running',
      count: stats.running,
      icon: Play,
      color: 'text-blue-600 bg-blue-50',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
    },
    {
      id: JobStatus.COMPLETED,
      label: 'Completed',
      count: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
    },
    {
      id: JobStatus.FAILED,
      label: 'Failed',
      count: stats.failed,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`flex flex-col p-4 bg-white rounded-xl border text-left transition-all hover:shadow-md ${
              isActive
                ? `${card.activeBorder} shadow-sm bg-slate-50/50`
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {card.count}
            </div>
          </button>
        );
      })}
    </div>
  );
};
