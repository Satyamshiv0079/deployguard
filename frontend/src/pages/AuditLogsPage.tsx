import React, { useEffect, useState } from 'react';
import { auditService } from '../services/riskService';
import { AuditLogItem } from '../types';
import { useToast } from '../components/common/Toast';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Terminal,
  User,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const { error } = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAuditLogs({
        action: actionFilter || undefined,
        username: usernameFilter || undefined,
        size: 50,
      });
      setLogs(res.content);
    } catch (err: any) {
      error('Failed to load compliance audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, usernameFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Immutable Compliance Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident system activity ledger satisfying SOC2 Type II, ISO 27001, and banking governance standards.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded">
          <ShieldCheck className="w-4 h-4" /> APPEND-ONLY STORAGE ENFORCED
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg">
        <Filter className="w-4 h-4 text-slate-500" />

        <input
          type="text"
          placeholder="Filter by operator username..."
          value={usernameFilter}
          onChange={(e) => setUsernameFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Governance Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="USER_CREATED">USER CREATED</option>
          <option value="PROJECT_CREATED">PROJECT CREATED</option>
          <option value="PROJECT_UPDATED">PROJECT UPDATED</option>
          <option value="PROJECT_ARCHIVED">PROJECT ARCHIVED</option>
          <option value="TASK_CREATED">TASK CREATED</option>
          <option value="DEPLOYMENT_REQUESTED">DEPLOYMENT REQUESTED</option>
          <option value="DEPLOYMENT_APPROVED">DEPLOYMENT APPROVED</option>
          <option value="DEPLOYMENT_REJECTED">DEPLOYMENT REJECTED</option>
          <option value="DEPLOYMENT_EXECUTED">DEPLOYMENT EXECUTED</option>
          <option value="DEPLOYMENT_ROLLED_BACK">DEPLOYMENT ROLLED BACK</option>
          <option value="RISK_CREATED">RISK CREATED</option>
          <option value="RISK_UPDATED">RISK UPDATED</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase">Timestamp (UTC)</th>
                <th className="py-3 px-4 font-semibold uppercase">Action</th>
                <th className="py-3 px-4 font-semibold uppercase">Principal</th>
                <th className="py-3 px-4 font-semibold uppercase">Target Entity</th>
                <th className="py-3 px-4 font-semibold uppercase">Client IP</th>
                <th className="py-3 px-4 font-semibold uppercase">Verification Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Querying secure audit datastore...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {log.username}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <span className="text-slate-400">{log.entityType}:</span>{' '}
                      <span className="text-[11px] text-indigo-400">{log.entityId?.substring(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{log.ipAddress}</td>
                    <td className="py-3 px-4 text-slate-200 font-sans text-xs max-w-md truncate">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
