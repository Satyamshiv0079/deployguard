import React, { useEffect, useState } from 'react';
import { riskService } from '../services/riskService';
import { projectService, userService } from '../services/projectService';
import {
  RiskItem,
  RiskSeverity,
  RiskStatus,
  Project,
  UserProfile,
} from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import {
  ShieldAlert,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';

export const RisksPage: React.FC = () => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Sort
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<'riskScore' | 'dueDate' | 'title'>('riskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Risk Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    ownerId: '',
    probability: 3,
    impact: 3,
    mitigationPlan: '',
    dueDate: '',
  });

  // Add Mitigation Action Modal
  const [isMitigationModalOpen, setIsMitigationModalOpen] = useState(false);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [mitigationForm, setMitigationForm] = useState({
    actionTitle: '',
    actionDescription: '',
    ownerId: '',
    completed: false,
  });

  const { isProjectManager } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskRes, projRes, userRes] = await Promise.all([
        riskService.getRisks({
          severity: severityFilter === 'ALL' ? undefined : (severityFilter as RiskSeverity),
          status: statusFilter === 'ALL' ? undefined : (statusFilter as RiskStatus),
        }),
        projectService.getProjects(),
        userService.getAllUsers(),
      ]);
      setRisks(riskRes.content);
      setProjects(projRes.content);
      setUsers(userRes);
      if (projRes.content.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: projRes.content[0].id }));
      }
    } catch (err: any) {
      error('Failed to load risk register.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [severityFilter, statusFilter]);

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId) {
      error('Title and Project are required.');
      return;
    }

    try {
      await riskService.createRisk({
        ...formData,
        ownerId: formData.ownerId || undefined,
      });
      success('Risk registered successfully.');
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        projectId: projects[0]?.id || '',
        ownerId: '',
        probability: 3,
        impact: 3,
        mitigationPlan: '',
        dueDate: '',
      });
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create risk.');
    }
  };

  const handleAddMitigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiskId || !mitigationForm.actionTitle) return;

    try {
      await riskService.addMitigation(selectedRiskId, {
        ...mitigationForm,
        ownerId: mitigationForm.ownerId || undefined,
      });
      success('Mitigation control action logged.');
      setIsMitigationModalOpen(false);
      setMitigationForm({
        actionTitle: '',
        actionDescription: '',
        ownerId: '',
        completed: false,
      });
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to add mitigation.');
    }
  };

  const handleStatusChange = async (riskId: string, newStatus: RiskStatus) => {
    try {
      await riskService.updateRisk(riskId, { status: newStatus });
      success(`Risk status updated to ${newStatus}.`);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update risk status.');
    }
  };

  const calculatedScore = formData.probability * formData.impact;

  const sortedRisks = [...risks].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'riskScore') {
      comparison = a.riskScore - b.riskScore;
    } else if (sortField === 'dueDate') {
      comparison = (a.dueDate || '').localeCompare(b.dueDate || '');
    } else {
      comparison = a.title.localeCompare(b.title);
    }
    return sortAsc ? comparison : -comparison;
  });

  const toggleSort = (field: 'riskScore' | 'dueDate' | 'title') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Enterprise Risk &amp; Controls Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Systemic exposure rating (P × I), regulatory vulnerabilities, and mitigation remediation plans.
          </p>
        </div>

        {isProjectManager && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Register Risk
          </button>
        )}
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Registered</div>
          <div className="text-xl font-bold text-white mt-1 tabular-nums">{risks.length}</div>
        </div>
        <div className="bg-slate-900 border border-rose-900/40 rounded-lg p-3">
          <div className="text-[10px] font-mono uppercase text-rose-400">Critical (Score ≥ 16)</div>
          <div className="text-xl font-bold text-rose-400 mt-1 tabular-nums">
            {risks.filter((r) => r.severity === 'CRITICAL').length}
          </div>
        </div>
        <div className="bg-slate-900 border border-amber-900/40 rounded-lg p-3">
          <div className="text-[10px] font-mono uppercase text-amber-400">Mitigating Controls</div>
          <div className="text-xl font-bold text-amber-400 mt-1 tabular-nums">
            {risks.filter((r) => r.status === 'MITIGATING').length}
          </div>
        </div>
        <div className="bg-slate-900 border border-emerald-900/40 rounded-lg p-3">
          <div className="text-[10px] font-mono uppercase text-emerald-400">Resolved / Closed</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
            {risks.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length}
          </div>
        </div>
      </div>

      {/* Filter & View Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL (Score ≥ 16)</option>
            <option value="HIGH">HIGH (Score ≥ 10)</option>
            <option value="MEDIUM">MEDIUM (Score ≥ 5)</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="MITIGATING">MITIGATING</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-md">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              viewMode === 'table'
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dense Table View"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              viewMode === 'cards'
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      </div>

      {/* Risks Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : sortedRisks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Risks Under Selected Parameters</h3>
          <p className="text-xs text-slate-500 mt-1">All governance metrics are in compliance.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Dense Enterprise Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3">Project</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Risk Title</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('riskScore')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Score (P×I)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Controls</th>
                  <th className="py-3 px-3">Owner</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Due Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedRisks.map((risk) => {
                  const isExpanded = expandedRiskId === risk.id;
                  const isCritical = risk.severity === 'CRITICAL';
                  const completedMitigations =
                    risk.mitigations?.filter((m) => m.completed).length || 0;
                  const totalMitigations = risk.mitigations?.length || 0;

                  return (
                    <React.Fragment key={risk.id}>
                      <tr
                        className={`hover:bg-slate-850/50 transition ${
                          isCritical ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRiskId(isExpanded ? null : risk.id)
                            }
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title={isExpanded ? 'Collapse details' : 'Expand details'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 font-bold border border-slate-700">
                            {risk.projectKey}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-100">{risk.title}</div>
                          {risk.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {risk.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-xs ${
                                risk.riskScore >= 16
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : risk.riskScore >= 10
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-950 text-slate-300 border border-slate-800'
                              }`}
                            >
                              {risk.riskScore}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (P{risk.probability}×I{risk.impact})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <PriorityBadge priority={risk.severity} />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <select
                            value={risk.status}
                            onChange={(e) =>
                              handleStatusChange(risk.id, e.target.value as RiskStatus)
                            }
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="MITIGATING">MITIGATING</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                          {totalMitigations > 0 ? (
                            <span
                              className={`px-2 py-0.5 rounded ${
                                completedMitigations === totalMitigations
                                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {completedMitigations}/{totalMitigations} actions
                            </span>
                          ) : (
                            <span className="text-slate-500">None logged</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                          {risk.ownerFullName || (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {risk.dueDate || 'Continuous'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRiskId(risk.id);
                              setIsMitigationModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-sky-300 bg-sky-950/70 border border-sky-800/80 rounded hover:bg-sky-900/70 transition inline-flex items-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3 h-3" /> Control
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/60">
                          <td colSpan={10} className="p-4 pl-10 border-t border-slate-800/60">
                            <div className="space-y-3">
                              <div>
                                <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                                  Full Risk Description:
                                </span>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  {risk.description || 'No extended description provided.'}
                                </p>
                              </div>

                              {risk.mitigationPlan && (
                                <div className="bg-slate-900/90 border border-slate-800 rounded p-3 text-xs">
                                  <span className="text-slate-400 font-semibold block mb-0.5">
                                    Control Strategy:
                                  </span>
                                  <p className="text-slate-300 leading-relaxed">
                                    {risk.mitigationPlan}
                                  </p>
                                </div>
                              )}

                              {risk.mitigations && risk.mitigations.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold block">
                                    Action Items ({risk.mitigations.length}):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {risk.mitigations.map((m) => (
                                      <div
                                        key={m.id}
                                        className="text-xs flex items-center gap-2 p-2 rounded bg-slate-900/80 border border-slate-800"
                                      >
                                        <CheckCircle2
                                          className={`w-3.5 h-3.5 shrink-0 ${
                                            m.completed ? 'text-emerald-400' : 'text-slate-600'
                                          }`}
                                        />
                                        <span
                                          className={
                                            m.completed
                                              ? 'line-through text-slate-500'
                                              : 'text-slate-200 font-medium'
                                          }
                                        >
                                          {m.actionTitle}
                                        </span>
                                        {m.ownerFullName && (
                                          <span className="text-[10px] text-slate-400 font-mono ml-auto">
                                            {m.ownerFullName}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Cards View */
        <div className="space-y-3.5">
          {sortedRisks.map((risk) => (
            <div
              key={risk.id}
              className={`bg-slate-900 border rounded-lg p-5 transition ${
                risk.severity === 'CRITICAL'
                  ? 'border-rose-800/80 bg-rose-950/15'
                  : 'border-slate-800 hover:border-slate-750'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold border border-slate-700">
                      {risk.projectKey}
                    </span>
                    <PriorityBadge priority={risk.severity} />
                    <StatusBadge status={risk.status} />

                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-800">
                      Risk Score:{' '}
                      <strong
                        className={
                          risk.riskScore >= 16
                            ? 'text-rose-400 font-bold'
                            : 'text-slate-100 font-semibold'
                        }
                      >
                        {risk.riskScore}
                      </strong>{' '}
                      <span className="text-slate-400 text-[11px]">
                        (P:{risk.probability} × I:{risk.impact})
                      </span>
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {risk.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {risk.description}
                  </p>

                  {/* Mitigation Plan Overview */}
                  {risk.mitigationPlan && (
                    <div className="mt-3 text-xs bg-slate-950/80 border border-slate-800 rounded p-3">
                      <span className="text-slate-400 font-semibold block mb-0.5">
                        Control / Mitigation Strategy:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{risk.mitigationPlan}</p>
                    </div>
                  )}

                  {/* Active Mitigation Actions List */}
                  {risk.mitigations && risk.mitigations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block font-semibold">
                        Remediation Action Items ({risk.mitigations.length}):
                      </span>
                      {risk.mitigations.map((m) => (
                        <div key={m.id} className="text-xs flex items-center gap-2 text-slate-300">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              m.completed ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          />
                          <span
                            className={
                              m.completed
                                ? 'line-through text-slate-500'
                                : 'text-slate-200 font-medium'
                            }
                          >
                            {m.actionTitle}
                          </span>
                          {m.ownerFullName && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({m.ownerFullName})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                    <span>
                      Owner:{' '}
                      <strong className="text-slate-300 font-normal">
                        {risk.ownerFullName || 'Unassigned'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{risk.dueDate ? `Due: ${risk.dueDate}` : 'Continuous Monitoring'}</span>
                  </div>
                </div>

                {/* Status & Add Mitigation Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRiskId(risk.id);
                      setIsMitigationModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/70 border border-sky-800/80 rounded hover:bg-sky-900/70 transition flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Control
                  </button>

                  <select
                    value={risk.status}
                    onChange={(e) => handleStatusChange(risk.id, e.target.value as RiskStatus)}
                    className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="MITIGATING">MITIGATING</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Risk Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register Platform Risk Exposure"
        subtitle="Calculate probability and impact ratings to determine regulatory exposure score."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRisk} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Risk Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              placeholder="e.g., Latency degradation during Clearing House market open"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Governed Project *
              </label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Risk Owner
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.department || 'Officer'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Probability & Impact Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-md border border-slate-800">
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-mono mb-1.5">
                <span>Probability (1-5)</span>
                <strong className="text-sky-400 font-bold">{formData.probability}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                className="w-full accent-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 font-mono mb-1.5">
                <span>Impact (1-5)</span>
                <strong className="text-sky-400 font-bold">{formData.impact}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                className="w-full accent-sky-500"
              />
            </div>

            <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Calculated Exposure Rating:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  calculatedScore >= 16
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : calculatedScore >= 10
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                {calculatedScore} / 25 ({calculatedScore >= 16 ? 'CRITICAL' : calculatedScore >= 10 ? 'HIGH' : calculatedScore >= 5 ? 'MEDIUM' : 'LOW'})
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Mitigation Plan & Controls
            </label>
            <textarea
              rows={3}
              value={formData.mitigationPlan}
              onChange={(e) => setFormData({ ...formData, mitigationPlan: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              placeholder="Outline circuit breakers, fallback systems, or compliance remediations..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Remediation Target Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition shadow-xs"
            >
              Register Risk
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Mitigation Control Modal */}
      <Modal
        isOpen={isMitigationModalOpen}
        onClose={() => setIsMitigationModalOpen(false)}
        title="Add Remediation Control Action"
        subtitle="Log an actionable task to mitigate or remediate identified vulnerability."
      >
        <form onSubmit={handleAddMitigation} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Control Action Title *
            </label>
            <input
              type="text"
              required
              value={mitigationForm.actionTitle}
              onChange={(e) => setMitigationForm({ ...mitigationForm, actionTitle: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              placeholder="e.g., Configure synthetic health checks every 10s"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Action Details & Verification Criteria
            </label>
            <textarea
              rows={2}
              value={mitigationForm.actionDescription}
              onChange={(e) => setMitigationForm({ ...mitigationForm, actionDescription: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMitigationModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition shadow-xs"
            >
              Save Control Action
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
