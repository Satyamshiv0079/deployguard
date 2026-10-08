import React, { useEffect, useState } from 'react';
import { deploymentService } from '../services/deploymentService';
import { projectService } from '../services/projectService';
import {
  DeploymentItem,
  DeploymentEnvironment,
  DeploymentStatus,
  Priority,
  Project,
} from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Link } from 'react-router-dom';
import {
  Rocket,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';

export const DeploymentsPage: React.FC = () => {
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [envFilter, setEnvFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Request Deployment Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    version: '',
    environment: 'DEVELOPMENT' as DeploymentEnvironment,
    reason: '',
    changeDescription: '',
    riskLevel: 'MEDIUM' as Priority,
  });

  // Action Confirmation Dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'execute' | 'rollback';
    deploymentId: string;
    version: string;
    isOpen: boolean;
  }>({
    type: 'approve',
    deploymentId: '',
    version: '',
    isOpen: false,
  });
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, isReviewer, isDeveloper, isAdmin } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [depRes, projRes] = await Promise.all([
        deploymentService.getDeployments({
          environment: envFilter === 'ALL' ? undefined : (envFilter as DeploymentEnvironment),
          status: statusFilter === 'ALL' ? undefined : (statusFilter as DeploymentStatus),
        }),
        projectService.getProjects(),
      ]);
      setDeployments(depRes.content);
      setProjects(projRes.content);
      if (projRes.content.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: projRes.content[0].id }));
      }
    } catch (err: any) {
      error('Failed to load deployment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [envFilter, statusFilter]);

  const handleRequestDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.version || !formData.reason) {
      error('Please fill in required fields.');
      return;
    }

    try {
      await deploymentService.requestDeployment(formData);
      success(`Deployment request for ${formData.version} submitted successfully.`);
      setIsRequestModalOpen(false);
      setFormData({
        projectId: projects[0]?.id || '',
        version: '',
        environment: 'DEVELOPMENT',
        reason: '',
        changeDescription: '',
        riskLevel: 'MEDIUM',
      });
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to submit deployment request.');
    }
  };

  const executeConfirmedAction = async () => {
    const { type, deploymentId } = confirmAction;
    try {
      setIsProcessing(true);
      if (type === 'approve') {
        await deploymentService.approveDeployment(deploymentId, actionReason || 'Governance criteria verified. Approved.');
        success('Deployment approved successfully.');
      } else if (type === 'reject') {
        await deploymentService.rejectDeployment(deploymentId, actionReason || 'Governance criteria not met.');
        success('Deployment rejected.');
      } else if (type === 'execute') {
        await deploymentService.executeDeployment(deploymentId);
        success('Deployment executed and rolled out successfully.');
      } else if (type === 'rollback') {
        if (!actionReason.trim()) {
          error('Rollback reason is strictly mandatory for compliance audit.');
          setIsProcessing(false);
          return;
        }
        await deploymentService.rollbackDeployment(deploymentId, actionReason);
        success('Deployment rolled back to previous stable release.');
      }
      setConfirmAction({ ...confirmAction, isOpen: false });
      setActionReason('');
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-400" /> Software Deployment & Release Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforced Four-Eyes approval gates, audit trails, and automated rollback orchestration.
          </p>
        </div>

        {isDeveloper && (
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Request Deployment
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg">
        <Filter className="w-4 h-4 text-slate-500" />

        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Environments</option>
          <option value="DEVELOPMENT">DEVELOPMENT</option>
          <option value="TEST">TEST</option>
          <option value="STAGING">STAGING</option>
          <option value="PRODUCTION">PRODUCTION</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="UNDER_REVIEW">UNDER REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="SUCCESSFUL">SUCCESSFUL</option>
          <option value="FAILED">FAILED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="ROLLED_BACK">ROLLED BACK</option>
        </select>
      </div>

      {/* Deployments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-lg border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : deployments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <Rocket className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Deployment Requests Found</h3>
          <p className="text-xs text-slate-500 mt-1">Submit a deployment request to trigger the approval pipeline.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deployments.map((d) => {
            const isRequester = d.requestedById === user?.id;
            const canApprove = (isReviewer || isAdmin) && d.status === 'UNDER_REVIEW' && !isRequester;
            const canExecute = d.eligibleForExecution && (isDeveloper || isAdmin);
            const canRollback = d.status === 'SUCCESSFUL' && (isDeveloper || isReviewer || isAdmin);

            return (
              <div
                key={d.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-5 hover:border-slate-700 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold border border-slate-700">
                        {d.projectKey}
                      </span>
                      <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {d.version}
                      </span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {d.environment}
                      </span>
                      <PriorityBadge priority={d.riskLevel} />
                      <StatusBadge status={d.status} />

                      {d.requiresApproval && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Four-Eyes Gate
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-white">{d.projectName}: {d.reason}</h3>

                    {d.changeDescription && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                        {d.changeDescription}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>Requested by: <strong className="text-slate-300 font-normal">{d.requestedByFullName}</strong></span>
                      <span>•</span>
                      <span className="font-mono">Pipeline ID: {d.pipelineRunId || 'N/A'}</span>
                      {d.rollbackReason && (
                        <>
                          <span>•</span>
                          <span className="text-rose-400 font-medium">Rollback Reason: {d.rollbackReason}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <Link
                      to={`/deployments/${d.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition"
                    >
                      Dossier
                    </Link>

                    {/* Approve / Reject buttons */}
                    {canApprove && (
                      <>
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: 'approve',
                              deploymentId: d.id,
                              version: d.version,
                              isOpen: true,
                            })
                          }
                          className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800 hover:bg-emerald-900/80 rounded transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            setConfirmAction({
                              type: 'reject',
                              deploymentId: d.id,
                              version: d.version,
                              isOpen: true,
                            })
                          }
                          className="px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-950/80 border border-rose-800 hover:bg-rose-900/80 rounded transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {/* Segregation of duties warning if creator cannot approve */}
                    {isReviewer && d.status === 'UNDER_REVIEW' && isRequester && (
                      <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2.5 py-1 rounded flex items-center gap-1">
                        <Info className="w-3 h-3" /> Cannot approve own request
                      </span>
                    )}

                    {/* Execute Button */}
                    {canExecute && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: 'execute',
                            deploymentId: d.id,
                            version: d.version,
                            isOpen: true,
                          })
                        }
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5" /> Execute Rollout
                      </button>
                    )}

                    {/* Rollback Button */}
                    {canRollback && (
                      <button
                        onClick={() =>
                          setConfirmAction({
                            type: 'rollback',
                            deploymentId: d.id,
                            version: d.version,
                            isOpen: true,
                          })
                        }
                        className="px-3 py-1.5 text-xs font-medium text-purple-400 bg-purple-950/80 border border-purple-800 hover:bg-purple-900/80 rounded transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Rollback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Deployment Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Submit Deployment Request" maxWidth="lg">
        <form onSubmit={handleRequestDeployment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Target Project *
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
                Release Version Tag *
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                placeholder="e.g., v2.5.0-rc2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Environment *
              </label>
              <select
                required
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as DeploymentEnvironment })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="DEVELOPMENT">DEVELOPMENT (Auto-approved)</option>
                <option value="TEST">TEST (Integration verification)</option>
                <option value="STAGING">STAGING (Requires Review)</option>
                <option value="PRODUCTION">PRODUCTION (Mandatory Four-Eyes Approval)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Risk Level *
              </label>
              <select
                value={formData.riskLevel}
                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as Priority })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Deployment Reason / Business Justification *
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Scheduled Core Banking gateway quarterly upgrade"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Change Description & Git Commits
            </label>
            <textarea
              rows={3}
              value={formData.changeDescription}
              onChange={(e) => setFormData({ ...formData, changeDescription: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="Summary of commit range, schema alterations, and verification checklist..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition shadow-sm"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Approve / Reject / Execute / Rollback */}
      <Modal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
        title={`Confirm Deployment ${confirmAction.type.toUpperCase()}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to proceed with{' '}
            <strong className="text-white uppercase">{confirmAction.type}</strong> for version{' '}
            <strong className="text-indigo-400 font-mono">{confirmAction.version}</strong>?
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
              {confirmAction.type === 'rollback'
                ? 'Mandatory Rollback Justification *'
                : 'Reviewer Notes & Verification Comments'}
            </label>
            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder={
                confirmAction.type === 'rollback'
                  ? 'Detail anomaly, metric breach, or incident report ticket...'
                  : 'Document sanity tests, vulnerability scans, and approval notes...'
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={executeConfirmedAction}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition text-white ${
                confirmAction.type === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : confirmAction.type === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : confirmAction.type === 'rollback'
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isProcessing ? 'Executing...' : `Confirm ${confirmAction.type}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
