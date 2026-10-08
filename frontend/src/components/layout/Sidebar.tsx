import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  CheckSquare,
  Rocket,
  ShieldAlert,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { isReviewer, isProjectManager, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderGit2 },
    { name: 'Tasks & Agile', path: '/tasks', icon: CheckSquare },
    { name: 'Deployments', path: '/deployments', icon: Rocket },
    { name: 'Risk & Controls', path: '/risks', icon: ShieldAlert },
    { name: 'Audit Compliance', path: '/audit-logs', icon: FileText, show: isReviewer || isProjectManager || isAdmin },
    { name: 'Identity & Access', path: '/profile', icon: UserCheck },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-3 mb-2 font-semibold">
          Platform Governance
        </div>
        <nav className="space-y-1">
          {navItems
            .filter((item) => item.show !== false)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
        </nav>
      </div>

      {/* Compliance / Regulatory standard footer badge */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 mb-1 text-slate-300 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          <span>SOC2 / ISO 27001</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Four-Eyes Deployment Approval & Audit Trail Active.
        </p>
      </div>
    </aside>
  );
};
