import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, User, Activity, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              DeployGuard
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/80">
                ENTERPRISE
              </span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* System Health Pulse */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-mono text-[11px] text-slate-400">GATEWAY: HEALTHY</span>
        </div>

        {/* Notifications Icon (Mock indicator) */}
        <div className="relative p-2 text-slate-400 hover:text-slate-200 cursor-pointer rounded-md hover:bg-slate-800/60 transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
              {user?.fullName?.charAt(0) || <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-none">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                {user?.roles?.[0]?.replace('ROLE_', '')}
              </div>
            </div>
          </Link>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800/60 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
