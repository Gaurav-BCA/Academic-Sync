import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 animate-fade-in max-w-sm w-full">
      <div
        className={`p-4 rounded-2xl border shadow-xl flex items-start space-x-3 transition-all ${
          isError
            ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-900/10'
            : isSuccess
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-900/10'
            : 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-900/10'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
        </div>
        <div className="flex-1 text-xs">
          {toast.title && <h4 className="font-jakarta font-bold text-sm mb-0.5">{toast.title}</h4>}
          <p className="font-sans font-medium leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
