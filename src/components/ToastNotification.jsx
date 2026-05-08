import { useState, useEffect } from 'react';

export default function ToastNotification({ toasts, removeToast }) {
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '320px' }}
    >
      {toasts.slice(0, 4).map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2700);
    const removeTimer = setTimeout(() => removeToast(toast.id), 3000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, removeToast]);

  const typeStyles = {
    success: {
      border: 'border-emerald-500',
      icon: '✓',
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-400',
    },
    error: {
      border: 'border-red-500',
      icon: '✕',
      iconBg: 'bg-red-500',
      text: 'text-red-400',
    },
    info: {
      border: 'border-cyan-500',
      icon: 'ℹ',
      iconBg: 'bg-cyan-500',
      text: 'text-cyan-400',
    },
    warning: {
      border: 'border-amber-500',
      icon: '⚠',
      iconBg: 'bg-amber-500',
      text: 'text-amber-400',
    },
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-3 rounded-lg
        border ${style.border} backdrop-blur-md
        ${exiting ? 'animate-toast-exit' : 'animate-toast-enter'}
      `}
      style={{
        background: 'rgba(10, 15, 30, 0.95)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full ${style.iconBg} flex items-center justify-center text-white text-xs font-bold`}
      >
        {style.icon}
      </div>
      <p className={`flex-1 text-sm font-medium ${style.text} font-space-grotesk leading-snug`}>
        {toast.message}
      </p>
      <button
        onClick={() => { setExiting(true); setTimeout(() => removeToast(toast.id), 300); }}
        className="flex-shrink-0 text-gray-500 hover:text-white transition-colors text-sm leading-none pointer-events-auto"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
