import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantClasses = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    neutral: 'bg-slate-800/80 text-slate-400 border border-slate-700/60',
    success: 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950/70 text-amber-400 border border-amber-800/60',
    danger: 'bg-rose-950/70 text-rose-400 border border-rose-800/60',
    info: 'bg-blue-950/70 text-blue-400 border border-blue-800/60',
    purple: 'bg-purple-950/70 text-purple-400 border border-purple-800/60',
  }[variant];

  return (
    <span className={`inline-flex items-center font-mono font-medium rounded-md tracking-wide ${sizeClasses} ${variantClasses}`}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'SUCCESSFUL':
    case 'DONE':
    case 'COMPLETED':
    case 'APPROVED':
    case 'RESOLVED':
    case 'CLOSED':
      return <Badge variant="success">{status.replace('_', ' ')}</Badge>;

    case 'IN_PROGRESS':
    case 'UNDER_REVIEW':
    case 'REQUESTED':
    case 'MITIGATING':
      return <Badge variant="info">{status.replace('_', ' ')}</Badge>;

    case 'AT_RISK':
    case 'IN_REVIEW':
    case 'ACCEPTED':
      return <Badge variant="warning">{status.replace('_', ' ')}</Badge>;

    case 'FAILED':
    case 'BLOCKED':
    case 'REJECTED':
    case 'CANCELLED':
      return <Badge variant="danger">{status.replace('_', ' ')}</Badge>;

    case 'ROLLED_BACK':
      return <Badge variant="purple">{status.replace('_', ' ')}</Badge>;

    case 'PLANNED':
    case 'TODO':
    case 'OPEN':
    default:
      return <Badge variant="neutral">{status.replace('_', ' ')}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return <Badge variant="danger">CRITICAL</Badge>;
    case 'HIGH':
      return <Badge variant="warning">HIGH</Badge>;
    case 'MEDIUM':
      return <Badge variant="info">MEDIUM</Badge>;
    case 'LOW':
    default:
      return <Badge variant="neutral">LOW</Badge>;
  }
};
