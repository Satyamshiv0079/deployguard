import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { deploymentService } from '../services/deploymentService';
import { DashboardSummary } from '../types';
import { StatusBadge, PriorityBadge, EnvironmentBadge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import {
  FolderGit2,
  Rocket,
  ShieldAlert,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const { isReviewer, user } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSummary();
      setData(res);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      error('Failed to load real-time dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickApprove = async (id: string) => {
    try {
      await deploymentService.approveDeployment(
        id,
        'Approved via Executive Command Center four-eyes verification.'
      );
      success('Deployment approved successfully.');
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Approval sign-off failed.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-900 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
          <div className="h-80 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Dashboard Telemetry Unavailable</h2>
          <p className="text-xs text-slate-400 mt-1">
            Unable to retrieve dashboard metrics from DeployGuard backend. Please check connectivity or try again.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Retry Connection
        </button>
      </div>
    );
  }

  const hasUrgentItems =
    data.pendingDeployments > 0 || data.criticalRisks > 0 || data.overdueTasks > 0;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Deployment &amp; Governance Dashboard
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 text-[10px] font-mono border border-amber-800/80">
              <Activity className="w-3 h-3" /> SANDBOX ENVIRONMENT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pipeline posture, four-eyes gate enforcement, and systemic risk telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {lastUpdated && (
            <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
              Synced {lastUpdated}
            </span>
          )}
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            to="/deployments"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition flex items-center gap-1.5 shadow-xs"
          >
            <Rocket className="w-3.5 h-3.5" /> Request Deployment
          </Link>
        </div>
      </div>

      {/* Operational Attention Banner */}
      {hasUrgentItems && (
        <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start md:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 md:mt-0" />
            <span className="text-slate-200">
              <strong className="text-amber-300 font-semibold">Action Items:</strong>{' '}
              {data.pendingDeployments > 0 && `${data.pendingDeployments} release(s) pending approval`}
              {data.pendingDeployments > 0 && data.criticalRisks > 0 && ' • '}
              {data.criticalRisks > 0 && `${data.criticalRisks} critical risk(s)`}
              {(data.pendingDeployments > 0 || data.criticalRisks > 0) && data.overdueTasks > 0 && ' • '}
              {data.overdueTasks > 0 && `${data.overdueTasks} overdue sprint deliverable(s)`}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
            {data.pendingDeployments > 0 && (
              <Link to="/deployments" className="text-amber-400 hover:underline">
                Review Releases →
              </Link>
            )}
            {data.criticalRisks > 0 && (
              <Link to="/risks" className="text-rose-400 hover:underline">
                Inspect Risks →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Governed Projects</span>
            <FolderGit2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight tabular-nums">
              {data.activeProjects}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {data.totalProjects} active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-medium font-mono">{data.completedProjects} Completed</span>
            <span>•</span>
            <span className={`font-mono ${data.blockedProjects > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
              {data.blockedProjects} Blocked
            </span>
          </div>
        </div>

        {/* KPI 2: Pending Releases */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Pending Releases</span>
            <Rocket className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight tabular-nums ${data.pendingDeployments > 0 ? 'text-amber-400' : 'text-white'}`}>
              {data.pendingDeployments}
            </span>
            <span className="text-xs text-slate-400 font-mono">awaiting gate sign-off</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-medium font-mono">{data.successfulDeployments} Success</span>
            <span>•</span>
            <span className={`font-mono ${data.failedDeployments > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}`}>
              {data.failedDeployments} Failed
            </span>
          </div>
        </div>

        {/* KPI 3: Critical Risks */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Critical Exposure</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight tabular-nums ${data.criticalRisks > 0 ? 'text-rose-400' : 'text-white'}`}>
              {data.criticalRisks}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {data.openRisks} open risks</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Total registered controls: <span className="font-semibold text-slate-300 font-mono">{data.totalRisks}</span>
          </div>
        </div>

        {/* KPI 4: Overdue Sprint Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Overdue Deliverables</span>
            <CheckSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight tabular-nums ${data.overdueTasks > 0 ? 'text-rose-400' : 'text-white'}`}>
              {data.overdueTasks}
            </span>
            <span className="text-xs text-slate-400 font-mono">past target deadline</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className={`font-mono ${data.blockedTasks > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
              {data.blockedTasks} Blocked
            </span>
            <span>•</span>
            <span className="text-slate-400 font-mono">{data.totalTasks} Total Tasks</span>
          </div>
        </div>
      </div>

      {/* Primary Governance Split: Pending Deployments & Critical Risk Register */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent / Pending Deployments */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-200">Release Pipeline Status</h3>
              </div>
              <Link
                to="/deployments"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium font-mono"
              >
                View Pipeline →
              </Link>
            </div>
            <div className="divide-y divide-slate-800/80">
              {data.recentDeployments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Zero active deployments recorded in current cycle.
                </div>
              ) : (
                data.recentDeployments.map((d) => {
                  const isRequester = d.requestedById === user?.id;
                  const canQuickApprove =
                    isReviewer && d.status === 'UNDER_REVIEW' && !isRequester;

                  return (
                    <div
                      key={d.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/40 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                            {d.projectKey}
                          </span>
                          <span className="font-mono text-[11px] text-white font-semibold">
                            {d.version}
                          </span>
                          <EnvironmentBadge environment={d.environment} />
                          <StatusBadge status={d.status} />
                        </div>
                        <div className="text-xs text-slate-300 truncate font-medium">
                          {d.reason}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                          <span>By: {d.requestedByFullName}</span>
                          <span>•</span>
                          <span>{d.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canQuickApprove && (
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(d.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/90 rounded hover:bg-emerald-900 transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sign-off
                          </button>
                        )}
                        <Link
                          to={`/deployments/${d.id}`}
                          className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-750 transition"
                        >
                          Dossier
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Critical Risks Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-200">Systemic Risk Exposure</h3>
              </div>
              <Link
                to="/risks"
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium font-mono"
              >
                Risk Register →
              </Link>
            </div>
            <div className="divide-y divide-slate-800/80">
              {data.criticalRiskList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Zero critical exposures detected. All parameters within regulatory tolerance.
                </div>
              ) : (
                data.criticalRiskList.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/40 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                          {r.projectKey}
                        </span>
                        <PriorityBadge priority={r.severity} />
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
                          Score: {r.riskScore} (P:{r.probability} × I:{r.impact})
                        </span>
                      </div>
                      <div className="text-xs text-slate-200 font-semibold truncate">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                        <span>Owner: {r.ownerFullName || 'Unassigned'}</span>
                        <span>•</span>
                        <span>Status: {r.status}</span>
                      </div>
                    </div>
                    <Link
                      to="/risks"
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded hover:bg-slate-750 transition self-start sm:self-center"
                    >
                      Mitigate
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Deployments by Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Deployment Pipeline Status</h3>
            <span className="text-xs font-mono text-slate-400">{data.totalDeployments} Total</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.deploymentsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#1e293b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {data.deploymentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Risks by Severity */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Risk Severity Exposure</h3>
            <span className="text-xs font-mono text-slate-400">{data.openRisks} Open</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.risksBySeverity}
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.risksBySeverity.map((entry, index) => (
                    <Cell key={`cell-risk-${index}`} fill={entry.color || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#1e293b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(val) => <span className="text-xs text-slate-300 font-mono">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Projects by Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Projects Lifecycle Breakdown</h3>
            <span className="text-xs font-mono text-slate-400">{data.totalProjects} Projects</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.projectsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#1e293b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {data.projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-proj-${index}`} fill={entry.color || '#0ea5e9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Tasks by Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Agile Task Execution Velocity</h3>
            <span className="text-xs font-mono text-slate-400">{data.totalTasks} Tasks</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tasksByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b1120',
                    borderColor: '#1e293b',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {data.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-task-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
