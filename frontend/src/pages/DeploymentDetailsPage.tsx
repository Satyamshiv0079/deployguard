import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { deploymentService } from '../services/deploymentService';
import { DeploymentItem } from '../types';
import { StatusBadge, PriorityBadge, EnvironmentBadge } from '../components/common/Badge';
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
  Lock,
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
        <div className="h-6 w-36 bg-slate-900 rounded animate-pulse" />
        <div className="h-64 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
        <div className="h-48 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-lg">
        <Rocket className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Deployment Record Not Found</h3>
        <Link
          to="/deployments"
          className="mt-3 text-xs text-sky-400 hover:underline inline-flex items-center gap-1 font-mono font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to releases
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Releases
        </Link>
      </div>

      {/* Main Dossier Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-sky-400 font-bold border border-slate-700">
                {deployment.projectKey}
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-950 font-bold text-white border border-slate-800">
                {deployment.version}
              </span>
              <EnvironmentBadge environment={deployment.environment} />
              <PriorityBadge priority={deployment.riskLevel} />
              <StatusBadge status={deployment.status} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{deployment.reason}</h1>
          </div>

          <div className="text-right font-mono text-xs text-slate-400 shrink-0">
            <div>
              Pipeline Run: <strong className="text-slate-200">{deployment.pipelineRunId || 'N/A'}</strong>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Requested: {deployment.createdAt}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-sky-400" /> Change Description & Git Commit Notes
            </h4>
            <div className="bg-slate-950 border border-slate-800 rounded-md p-4 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
              {deployment.changeDescription || 'No commit notes recorded.'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-800 font-mono">
            <div>
              <span className="text-slate-400 block mb-0.5 font-sans">Requested By:</span>
              <span className="font-semibold text-slate-200">{deployment.requestedByFullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-sans">Rollout Timestamp:</span>
              <span className="text-slate-300">
                {deployment.executedAt ? deployment.executedAt : 'Pending Execution'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-sans">Four-Eyes Verification:</span>
              <span className="text-emerald-400 font-medium">
                {deployment.requiresApproval ? 'Mandatory Gate Applied' : 'Automated Gate'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-sans">Reversion History:</span>
              <span className="text-violet-400">
                {deployment.rolledBackAt ? `Reverted ${deployment.rolledBackAt}` : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Approvals History Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-sky-400" /> Regulatory Sign-off & Audit Attestation Dossier
        </h3>

        {deployment.approvals.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/60 rounded-md border border-slate-800">
            Awaiting assigned independent reviewer sign-off. Segregation of duties prevents self-approval.
          </div>
        ) : (
          <div className="space-y-3.5">
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold text-white">
                      {app.reviewerFullName} <span className="text-slate-400 font-mono">(@{app.reviewerUsername})</span>
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{app.reviewedAt || app.createdAt}</span>
                  </div>
                  <div className="text-slate-300 mt-2 leading-relaxed bg-slate-900/80 p-3 rounded border border-slate-800">
                    "{app.comments || 'Attested and verified.'}"
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
