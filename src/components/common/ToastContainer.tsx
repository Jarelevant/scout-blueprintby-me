import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <aside aria-label="Notifications" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-lg text-xs transition-all duration-200 ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-[#202124]'
              : toast.type === 'error'
              ? 'bg-white border-rose-200 text-[#202124]'
              : toast.type === 'warning'
              ? 'bg-white border-amber-200 text-[#202124]'
              : 'bg-white border-[#E9EAEC] text-[#202124]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'warning' && (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            {toast.type === 'info' && (
              <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            )}
            <span className="font-medium leading-relaxed">{toast.text}</span>
          </div>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="text-[#9CA3AF] hover:text-[#202124] transition-colors p-0.5"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </aside>
  );
};
