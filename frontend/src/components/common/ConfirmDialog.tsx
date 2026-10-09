import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm Action',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-sky-400" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  const getButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-500';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-500';
      case 'info':
        return 'bg-sky-600 hover:bg-sky-500 text-white focus-visible:ring-sky-500';
      case 'warning':
      default:
        return 'bg-amber-600 hover:bg-amber-500 text-white focus-visible:ring-amber-500';
    }
  };

  const getIconContainerClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-950/70 border-rose-800/80 text-rose-400';
      case 'success':
        return 'bg-emerald-950/70 border-emerald-800/80 text-emerald-400';
      case 'info':
        return 'bg-sky-950/70 border-sky-800/80 text-sky-400';
      case 'warning':
      default:
        return 'bg-amber-950/70 border-amber-800/80 text-amber-400';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex gap-4 items-start">
        <div className={`shrink-0 p-2.5 rounded-lg border ${getIconContainerClass()}`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800/90 border border-slate-700 rounded-md hover:bg-slate-700 transition disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition shadow-xs flex items-center gap-2 ${getButtonClass()} disabled:opacity-50`}
        >
          {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span>{isLoading ? 'Processing...' : confirmText}</span>
        </button>
      </div>
    </Modal>
  );
};
