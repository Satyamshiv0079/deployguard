import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { deploymentService } from '../services/deploymentService';
import { DashboardSummary } from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
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
  const { isReviewer, user } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getSummary();
      setData(res);
    } catch (err: any) {
      error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickApprove = async (id: string) => {
    try {
      await deploymentService.approveDeployment(id, 'Approved via Executive Dashboard quick review.');
      success('Deployment approved successfully.');
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Approval failed.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-900 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-lg border border-slate-800 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900 rounded-lg border border-slate-800 animate-pulse"></div>
          <div className="h-80 bg-slate-900 rounded-lg border border-slate-800 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Governance & Deployment Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status monitoring, risk exposure, and release approval pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Refresh Metrics
          </button>
          <Link
            to="/deployments"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition flex items-center gap-1.5 shadow-sm"
          >
            <Rocket className="w-3.5 h-3.5" /> Request Deployment
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects KPI */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">{data.activeProjects}</span>
            <span className="text-xs text-slate-400">/ {data.totalProjects} total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">{data.completedProjects} Completed</span>
            <span>•</span>
            <span className="text-rose-400 font-medium">{data.blockedProjects} Blocked</span>
          </div>
        </div>

        {/* Deployments KPI */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Pending Approvals</span>
            <Rocket className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">{data.pendingDeployments}</span>
            <span className="text-xs text-slate-400">awaiting review</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">{data.successfulDeployments} Successful</span>
            <span>•</span>
            <span className="text-rose-400 font-medium">{data.failedDeployments} Failed</span>
          </div>
        </div>

        {/* Risks KPI */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Critical / High Risks</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">{data.criticalRisks}</span>
            <span className="text-xs text-slate-400">/ {data.openRisks} open</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Total registered risks: <span className="font-semibold text-slate-300">{data.totalRisks}</span>
          </div>
        </div>

        {/* Tasks KPI */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase tracking-wider">
            <span>Overdue Agile Tasks</span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">{data.overdueTasks}</span>
            <span className="text-xs text-slate-400">past deadline</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-amber-400 font-medium">{data.blockedTasks} Blocked</span>
            <span>•</span>
            <span className="text-slate-400">{data.totalTasks} Total Tasks</span>
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.deploymentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-proj-${index}`} fill={entry.color || '#3b82f6'} />
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
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-task-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dual Activity Streams: Recent Deployments & Critical Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deployments */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-indigo-400" /> Recent Deployments
            </h3>
            <Link to="/deployments" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {data.recentDeployments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No deployments recorded.</div>
            ) : (
              data.recentDeployments.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850/50 transition">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-semibold text-white">{d.projectName}</span>
                      <span className="text-slate-400">({d.projectKey})</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">{d.version}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Env: <strong className="text-slate-200">{d.environment}</strong></span>
                      <span>•</span>
                      <span>By: {d.requestedByFullName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={d.status} />
                    {isReviewer && d.status === 'UNDER_REVIEW' && d.requestedById !== user?.id && (
                      <button
                        onClick={() => handleQuickApprove(d.id)}
                        className="px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded hover:bg-emerald-900/60 transition"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Critical Risks */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Active Governance Risks
            </h3>
            <Link to="/risks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
              View matrix <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {data.criticalRiskList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Zero critical risks detected.</div>
            ) : (
              data.criticalRiskList.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850/50 transition">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-200">{r.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span className="font-mono">{r.projectKey}</span>
                      <span>•</span>
                      <span>Score: <strong className="text-rose-400">{r.riskScore}</strong> (P:{r.probability} × I:{r.impact})</span>
                    </div>
                  </div>
                  <div>
                    <PriorityBadge priority={r.severity} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
