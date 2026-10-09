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
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { isReviewer, isProjectManager, isAdmin } = useAuth();

  const sections = [
    {
      title: 'GOVERNANCE & RELEASES',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Deployments', path: '/deployments', icon: Rocket },
        { name: 'Risk & Controls', path: '/risks', icon: ShieldAlert },
      ],
    },
    {
      title: 'PORTFOLIO & EXECUTION',
      items: [
        { name: 'Projects', path: '/projects', icon: FolderGit2 },
        { name: 'Tasks & Agile', path: '/tasks', icon: CheckSquare },
      ],
    },
    {
      title: 'SECURITY & COMPLIANCE',
      items: [
        {
          name: 'Audit Logs & Governance',
          path: '/audit-logs',
          icon: FileText,
          show: isReviewer || isProjectManager || isAdmin,
        },
        { name: 'Identity & Access', path: '/profile', icon: UserCheck },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 w-64 h-full lg:h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header with Close button */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 lg:hidden">
          <span className="text-xs font-mono font-bold text-white tracking-wider">PLATFORM NAV</span>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          {sections.map((sec) => {
            const visibleItems = sec.items.filter((item) => item.show !== false);
            if (visibleItems.length === 0) return null;

            return (
              <div key={sec.title}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-3 mb-2 font-semibold">
                  {sec.title}
                </div>
                <nav className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded transition-all ${
                            isActive
                              ? 'bg-sky-500/10 text-sky-300 font-semibold border-l-2 border-sky-400 pl-2.5 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
            );
          })}
        </div>

        {/* Regulatory Governance Standard Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-slate-400">
          <div className="flex items-center gap-2 mb-1 text-slate-300 font-mono text-[11px] font-semibold">
            <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>SEGREGATION OF DUTIES</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Independent reviewer verification enforced for all production deployments.
          </p>
        </div>
      </aside>
    </>
  );
};
