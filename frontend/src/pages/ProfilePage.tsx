import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, KeyRound, Building, CheckCircle2, Lock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-sky-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Identity, Credentials & Access Management (IAM)
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographic token parameters, assigned enterprise privileges, and security clearance.
        </p>
      </div>

      {/* User Information Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-slate-800 border-2 border-sky-500/40 flex items-center justify-center text-xl font-bold text-sky-400 font-mono">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName}</h2>
            <div className="text-xs font-mono text-slate-400 mt-0.5">@{user?.username}</div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                Active Directory & PAM Clearance Verified
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Corporate Email:</span>
            <span className="font-mono text-slate-200">{user?.email}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Department Unit:</span>
            <span className="text-slate-200">{user?.department || 'Software Engineering'}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Account ID (UUID):</span>
            <span className="font-mono text-slate-400">{user?.id}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Authentication Mechanism:</span>
            <span className="font-mono text-sky-400">BCrypt (10 rounds) + HMAC-SHA256 JWT</span>
          </div>
        </div>

        {/* Assigned Roles */}
        <div className="pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 font-mono">
            Granted Role-Based Access Privileges (RBAC)
          </span>
          <div className="flex flex-wrap gap-2">
            {user?.roles?.map((role) => (
              <span
                key={role}
                className="px-3 py-1 rounded bg-sky-950/80 border border-sky-800 text-sky-300 font-mono text-xs font-semibold shadow-xs"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Security Architecture Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-sky-400" /> Platform Security Architecture Standards
        </h3>
        <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Four-Eyes Verification:</strong> Production release requires
              segregation of duties between engineer request and independent reviewer sign-off.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Stateless JWT Authentication:</strong> Signed claims with
              expiration time limits, passed via HTTP Bearer token headers.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Immutable Audit Trailing:</strong> Every create, modify,
              approve, rollback, and authentication action writes an audit event with IP resolution.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
