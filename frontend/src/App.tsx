import { useState, useEffect, useCallback } from 'react';
import { Job, JobStatus, CreateJobInput, JobStats } from './types/job';
import * as jobsApi from './api/jobsApi';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { JobList } from './components/JobList';
import { JobCreateModal } from './components/JobCreateModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ErrorBanner } from './components/ErrorBanner';
import { Loader2, Filter } from 'lucide-react';

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>({
    all: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [activeFilter, setActiveFilter] = useState<JobStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load stats from server
  const loadStats = useCallback(async () => {
    try {
      const statsData = await jobsApi.fetchJobStats();
      setStats(statsData);
    } catch {
      // Fallback: calculate stats locally if endpoint fails
    }
  }, []);

  // Load jobs based on selected filter
  const loadJobs = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const filterStatus = activeFilter === 'all' ? undefined : activeFilter;
        const jobsData = await jobsApi.fetchJobs(filterStatus);
        setJobs(jobsData);
        await loadStats();
        setErrorMessage(null);
      } catch (err: any) {
        const msg =
          err.response?.data?.message || err.message || 'Failed to load jobs.';
        setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeFilter, loadStats],
  );

  useEffect(() => {
    loadJobs(true);
  }, [loadJobs]);

  // Handle manual refresh button click
  const handleRefresh = () => {
    loadJobs(false);
  };

  // Handle Job Creation
  const handleCreateJob = async (input: CreateJobInput) => {
    const newJob = await jobsApi.createJob(input);
    // Reload jobs and stats to ensure consistency
    await loadJobs(false);
    return newJob;
  };

  // Handle Status Update with Concurrency Resilience
  const handleUpdateStatus = async (id: string, targetStatus: JobStatus) => {
    setUpdatingJobId(id);
    setErrorMessage(null);

    try {
      await jobsApi.updateJobStatus(id, targetStatus);
      await loadJobs(false);
    } catch (err: any) {
      let msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to update job status.';

      if (err.response?.status === 409 || err.response?.status === 400) {
        msg =
          'Unable to update job. It may have already been updated or modified in another browser tab.';
      }

      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
      // Auto refresh list from backend to reflect true DB state
      await loadJobs(false);
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Handle Job Deletion
  const handleDeleteConfirm = async (id: string) => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await jobsApi.deleteJob(id);
      setDeletingJob(null);
      await loadJobs(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to delete job.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        onRefresh={handleRefresh}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <ErrorBanner
            message={errorMessage}
            onRefresh={handleRefresh}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* Dashboard Statistics Grid */}
        <section>
          <StatsOverview
            stats={stats}
            activeFilter={activeFilter}
            onSelectFilter={(filter) => setActiveFilter(filter)}
          />
        </section>

        {/* Filter Bar & Header info */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Showing:</span>
            <span className="font-semibold text-slate-900 capitalize">
              {activeFilter === 'all' ? 'All Jobs' : `${activeFilter} Jobs`}
            </span>
            <span className="text-slate-400 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-full">
              ({jobs.length})
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
            {(['all', JobStatus.PENDING, JobStatus.RUNNING, JobStatus.COMPLETED, JobStatus.FAILED] as const).map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setActiveFilter(filterOption)}
                  className={`px-3 py-1.5 rounded-lg border capitalize transition-colors whitespace-nowrap ${
                    activeFilter === filterOption
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filterOption}
                </button>
              ),
            )}
          </div>
        </section>

        {/* Job Cards / Grid Content */}
        <section>
          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Loading jobs from server...
              </p>
            </div>
          ) : (
            <JobList
              jobs={jobs}
              activeFilter={activeFilter}
              onUpdateStatus={handleUpdateStatus}
              onDeleteRequest={(job) => setDeletingJob(job)}
              updatingJobId={updatingJobId}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Mini Job Queue Dashboard &bull; NestJS & React &bull; PostgreSQL Persistence
      </footer>

      {/* Modals */}
      <JobCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      <ConfirmDeleteModal
        job={deletingJob}
        onClose={() => setDeletingJob(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
export default App;
