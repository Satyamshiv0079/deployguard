import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Shield, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      error('Please enter both username and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ username, password });
      success('Enterprise session authenticated. Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed. Please verify credentials.';
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          DeployGuard Platform
        </h2>
        <p className="mt-1 text-center text-xs font-mono uppercase tracking-widest text-slate-400">
          Enterprise Deployment, Risk & Governance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Authorized Access & Audit Notice */}
        <div className="mb-4 p-3 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5 leading-relaxed font-mono">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            Authorized access only. Authentication events, role transitions, and release sign-offs are cryptographically signed and logged.
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-lg sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Username or Corporate ID
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Security Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none transition disabled:opacity-50 shadow-xs"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Authenticate Session <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Instant Evaluation Demo Credentials */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Evaluation Demo Accounts:
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold">
                SANDBOX DATA
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@123456')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Admin Clearance</div>
                <div className="text-[10px] text-slate-400 font-mono">admin / Admin@123456</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('rev_marcus', 'Password@123')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Release Reviewer</div>
                <div className="text-[10px] text-slate-400 font-mono">rev_marcus / Password@123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('pm_sarah', 'Password@123')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Project Manager</div>
                <div className="text-[10px] text-slate-400 font-mono">pm_sarah / Password@123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('dev_alex', 'Password@123')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Software Engineer</div>
                <div className="text-[10px] text-slate-400 font-mono">dev_alex / Password@123</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Need an engineer account?{' '}
            <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
