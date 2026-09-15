import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRefresh?: () => void;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRefresh,
  onDismiss,
}) => {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-rose-900">
            Action Couldn't Be Completed
          </h4>
          <p className="text-sm text-rose-700 mt-0.5">{message}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-900 underline mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh job list from server
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-100 transition-colors"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
