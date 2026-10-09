import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, User, Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getPrimaryRole = () => {
    const role = user?.roles?.[0] || 'ROLE_DEVELOPER';
    return role.replace('ROLE_', '');
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/80';
      case 'REVIEWER':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
      case 'PROJECT_MANAGER':
        return 'bg-sky-950/70 text-sky-300 border-sky-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand identity */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">DeployGuard</span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800/80 font-semibold tracking-wider">
                GOVERNANCE
              </span>
            </div>
            <span className="hidden md:block text-[10px] text-slate-400 font-mono tracking-wide -mt-0.5">
              Enterprise Release & Risk Architecture
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-mono text-[11px] text-slate-300 font-medium tracking-wide">SANDBOX ENVIRONMENT</span>
        </div>

        {/* Verified Security Architecture Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span>FOUR-EYES ENFORCED</span>
        </div>

        {/* User Clearance & Profile Link */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 p-1 rounded-md hover:bg-slate-800/60 transition"
          >
            <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 text-xs font-mono font-bold">
              {user?.fullName?.charAt(0) || <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight">{user?.fullName}</div>
              <div className="mt-0.5">
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getRoleBadgeVariant(
                    getPrimaryRole()
                  )}`}
                >
                  CLEARANCE: {getPrimaryRole()}
                </span>
              </div>
            </div>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            type="button"
            title="Sign Out of Platform"
            aria-label="Sign out"
            className="p-2 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800/80 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
