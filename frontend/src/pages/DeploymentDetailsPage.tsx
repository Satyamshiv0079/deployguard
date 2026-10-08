import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { deploymentService } from '../services/deploymentService';
import { DeploymentItem } from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Rocket,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  FileCode2,
} from 'lucide-react';

export const DeploymentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [deployment, setDeployment] = useState<DeploymentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    const loadDeployment = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await deploymentService.getDeploymentById(id);
        setDeployment(res);
      } catch (err: any) {
        error('Failed to load deployment dossier.');
      } finally {
        setLoading(false);
      }
    };
    loadDeployment();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-900 rounded animate-pulse"></div>
        <div className="h-64 bg-slate-900 rounded-lg border border-slate-800 animate-pulse"></div>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="text-center py-12">
        <h3 className="text-sm font-semibold text-slate-300">Deployment Not Found</h3>
        <Link to="/deployments" className="mt-2 text-xs text-indigo-400 hover:underline inline-block">
          Return to deployments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/deployments"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Deployments
        </Link>
      </div>

      {/* Main Dossier Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold border border-slate-700">
                {deployment.projectKey}
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-950 font-bold text-white border border-slate-800">
                {deployment.version}
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                {deployment.environment}
              </span>
              <PriorityBadge priority={deployment.riskLevel} />
              <StatusBadge status={deployment.status} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{deployment.reason}</h1>
          </div>

          <div className="text-right font-mono text-xs text-slate-400 shrink-0">
            <div>Pipeline ID: <strong className="text-slate-200">{deployment.pipelineRunId || 'N/A'}</strong></div>
            <div className="text-[11px] text-slate-500 mt-1">Requested: {deployment.createdAt}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Change Description & Git Commits
            </h4>
            <div className="bg-slate-950 border border-slate-800 rounded-md p-4 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
              {deployment.changeDescription || 'No commit notes recorded.'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">Requested By:</span>
              <span className="font-semibold text-slate-200">{deployment.requestedByFullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Execution Status:</span>
              <span className="font-mono text-slate-300">
                {deployment.executedAt ? `Executed ${deployment.executedAt}` : 'Pending Rollout'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Four-Eyes Gate:</span>
              <span className="text-emerald-400 font-medium">
                {deployment.requiresApproval ? 'Mandatory Review Required' : 'Automated Gate'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Rollback Log:</span>
              <span className="font-mono text-purple-400">
                {deployment.rolledBackAt ? `Reverted ${deployment.rolledBackAt}` : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Approvals History Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> Regulatory Approval Records & Sign-offs
        </h3>

        {deployment.approvals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/60 rounded-md border border-slate-800">
            No sign-offs recorded yet. Awaiting assigned reviewer verification.
          </div>
        ) : (
          <div className="space-y-4">
            {deployment.approvals.map((app) => (
              <div
                key={app.id}
                className="bg-slate-950 border border-slate-800 rounded-md p-4 flex items-start gap-3"
              >
                <div className="mt-0.5">
                  {app.status === 'APPROVED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{app.reviewerFullName} ({app.reviewerUsername})</span>
                    <span className="font-mono text-slate-400">{app.reviewedAt || app.createdAt}</span>
                  </div>
                  <div className="text-slate-300 mt-1 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    "{app.comments || 'No comments left.'}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
