import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastCounter = 0;
let addToastFn: (message: string, type: ToastType) => void = () => {};

export const toast = {
  success: (msg: string) => addToastFn(msg, 'success'),
  warning: (msg: string) => addToastFn(msg, 'warning'),
  error: (msg: string) => addToastFn(msg, 'error'),
  info: (msg: string) => addToastFn(msg, 'info'),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message: string, type: ToastType) => {
      const id = `${Date.now()}-${toastCounter++}`;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border border-slate-200 min-w-[320px] animate-in slide-in-from-right-full backdrop-blur-md",
            t.type === 'success' && "bg-white/90 border-emerald-100 text-emerald-600",
            t.type === 'warning' && "bg-white/90 border-amber-100 text-amber-600",
            t.type === 'error' && "bg-white/90 border-rose-100 text-rose-600",
            t.type === 'info' && "bg-white/90 border-blue-100 text-blue-600"
          )}
        >
          {t.type === 'success' && <CheckCircle size={18} className="shrink-0" />}
          {t.type === 'warning' && <AlertTriangle size={18} className="shrink-0" />}
          {t.type === 'error' && <AlertOctagon size={18} className="shrink-0" />}
          {t.type === 'info' && <Info size={18} className="shrink-0" />}
          
          <span className="flex-1 text-xs font-bold uppercase tracking-tight text-slate-700">{t.message}</span>
          
          <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
