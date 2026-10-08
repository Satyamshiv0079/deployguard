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
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';

export const RisksPage: React.FC = () => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" /> Enterprise Risk & Controls Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Systemic exposure rating (P × I), regulatory vulnerabilities, and mitigation remediation plans.
          </p>
        </div>

        {isProjectManager && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Register Risk
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg">
        <Filter className="w-4 h-4 text-slate-500" />

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="MITIGATING">MITIGATING</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Risks List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-lg border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : risks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-500/70 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Risks Under Selected Parameters</h3>
          <p className="text-xs text-slate-500 mt-1">All governance metrics are in compliance.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {risks.map((risk) => (
            <div
              key={risk.id}
              className={`bg-slate-900 border rounded-lg p-5 transition ${
                risk.severity === 'CRITICAL'
                  ? 'border-rose-900/60 bg-rose-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold border border-slate-700">
                      {risk.projectKey}
                    </span>
                    <PriorityBadge priority={risk.severity} />
                    <StatusBadge status={risk.status} />

                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-800">
                      Risk Score:{' '}
                      <strong className={risk.riskScore >= 16 ? 'text-rose-400' : 'text-slate-100'}>
                        {risk.riskScore}
                      </strong>{' '}
                      (Prob:{risk.probability} × Imp:{risk.impact})
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white">{risk.title}</h3>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{risk.description}</p>

                  {/* Mitigation Plan Overview */}
                  {risk.mitigationPlan && (
                    <div className="mt-3 text-xs bg-slate-950/80 border border-slate-800 rounded p-3">
                      <span className="text-slate-400 font-semibold block mb-0.5">Control / Mitigation Strategy:</span>
                      <p className="text-slate-300 leading-relaxed">{risk.mitigationPlan}</p>
                    </div>
                  )}

                  {/* Active Mitigation Actions List */}
                  {risk.mitigations && risk.mitigations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                        Remediation Action Items:
                      </span>
                      {risk.mitigations.map((m) => (
                        <div key={m.id} className="text-xs flex items-center gap-2 text-slate-300">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${m.completed ? 'text-emerald-400' : 'text-slate-600'}`}
                          />
                          <span className={m.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {m.actionTitle}
                          </span>
                          {m.ownerFullName && (
                            <span className="text-[10px] text-slate-400">({m.ownerFullName})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span>Owner: <strong className="text-slate-300 font-normal">{risk.ownerFullName || 'Unassigned'}</strong></span>
                    <span>•</span>
                    <span className="font-mono">{risk.dueDate ? `Due: ${risk.dueDate}` : 'Continuous Monitoring'}</span>
                  </div>
                </div>

                {/* Status & Add Mitigation Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedRiskId(risk.id);
                      setIsMitigationModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-950/60 border border-indigo-800/80 rounded hover:bg-indigo-900/60 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Control
                  </button>

                  <select
                    value={risk.status}
                    onChange={(e) => handleStatusChange(risk.id, e.target.value as RiskStatus)}
                    className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Register Platform Risk" maxWidth="lg">
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
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Latency degradation during Clearing House market open"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Project *
              </label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3 rounded-md border border-slate-800">
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-mono mb-1">
                <span>Probability (1-5)</span>
                <strong className="text-indigo-400">{formData.probability}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 font-mono mb-1">
                <span>Impact (1-5)</span>
                <strong className="text-indigo-400">{formData.impact}</strong>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Calculated Risk Score:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${calculatedScore >= 16 ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-white'}`}>
                {calculatedScore} / 25
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
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="Outline circuit breakers, fallback systems, or compliance remediations..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Remediation Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition shadow-sm"
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
        title="Add Mitigation Action Item"
      >
        <form onSubmit={handleAddMitigation} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Action Title *
            </label>
            <input
              type="text"
              required
              value={mitigationForm.actionTitle}
              onChange={(e) => setMitigationForm({ ...mitigationForm, actionTitle: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Configure synthetic health checks every 10s"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Action Details
            </label>
            <textarea
              rows={2}
              value={mitigationForm.actionDescription}
              onChange={(e) => setMitigationForm({ ...mitigationForm, actionDescription: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsMitigationModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition shadow-sm"
            >
              Save Control Action
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
