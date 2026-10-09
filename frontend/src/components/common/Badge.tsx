import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' | 'accent';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  const variantClasses = {
    default: 'bg-slate-900 text-slate-300 border-slate-700/80',
    neutral: 'bg-slate-900/90 text-slate-400 border-slate-800',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
    danger: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
    info: 'bg-sky-950/60 text-sky-300 border-sky-800/80',
    accent: 'bg-sky-900/40 text-sky-300 border-sky-600/60',
    purple: 'bg-violet-950/60 text-violet-300 border-violet-800/80',
  }[variant];

  const dotClasses = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-500',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    accent: 'bg-sky-400',
    purple: 'bg-violet-400',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded border tabular-nums tracking-wide shadow-xs ${sizeClasses} ${variantClasses}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses}`} />}
      <span>{children}</span>
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
      return (
        <Badge variant="success" dot>
          {status.replace(/_/g, ' ')}
        </Badge>
      );

    case 'IN_PROGRESS':
    case 'UNDER_REVIEW':
    case 'REQUESTED':
    case 'MITIGATING':
      return (
        <Badge variant="info" dot>
          {status.replace(/_/g, ' ')}
        </Badge>
      );

    case 'AT_RISK':
    case 'IN_REVIEW':
    case 'ACCEPTED':
      return (
        <Badge variant="warning" dot>
          {status.replace(/_/g, ' ')}
        </Badge>
      );

    case 'FAILED':
    case 'BLOCKED':
    case 'REJECTED':
    case 'CANCELLED':
      return (
        <Badge variant="danger" dot>
          {status.replace(/_/g, ' ')}
        </Badge>
      );

    case 'ROLLED_BACK':
      return (
        <Badge variant="purple" dot>
          {status.replace(/_/g, ' ')}
        </Badge>
      );

    case 'PLANNED':
    case 'TODO':
    case 'OPEN':
    default:
      return (
        <Badge variant="neutral" dot>
          {status.replace(/_/g, ' ')}
        </Badge>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <Badge variant="danger" dot>
          CRITICAL
        </Badge>
      );
    case 'HIGH':
      return (
        <Badge variant="warning" dot>
          HIGH
        </Badge>
      );
    case 'MEDIUM':
      return (
        <Badge variant="info" dot>
          MEDIUM
        </Badge>
      );
    case 'LOW':
    default:
      return (
        <Badge variant="neutral" dot>
          LOW
        </Badge>
      );
  }
};

export const EnvironmentBadge: React.FC<{ environment: string }> = ({ environment }) => {
  switch (environment) {
    case 'PRODUCTION':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-rose-950/80 text-rose-300 border border-rose-800 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          PROD
        </span>
      );
    case 'STAGING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-amber-950/60 text-amber-300 border border-amber-800 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          STAGE
        </span>
      );
    case 'TEST':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-sky-950/60 text-sky-300 border border-sky-800 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          TEST
        </span>
      );
    case 'DEVELOPMENT':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-slate-900 text-slate-300 border border-slate-700 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          DEV
        </span>
      );
  }
};
