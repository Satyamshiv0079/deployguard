import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Shield, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123456');
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
      success('Authenticated successfully. Welcome back!');
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Shield className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          DeployGuard Platform
        </h2>
        <p className="mt-1 text-center text-xs font-mono uppercase tracking-widest text-slate-400">
          Enterprise Deployment, Risk & Governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Username or Email
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials Quick-Select */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
              Instant Demo Profiles:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@123456')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">admin / Admin@123456</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('rev_marcus', 'Password@123')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Reviewer</div>
                <div className="text-[10px] text-slate-400 font-mono">rev_marcus / Password@123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('pm_sarah', 'Password@123')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Project Lead</div>
                <div className="text-[10px] text-slate-400 font-mono">pm_sarah / Password@123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('dev_alex', 'Password@123')}
                className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition"
              >
                <div className="font-semibold text-slate-200">Engineer</div>
                <div className="text-[10px] text-slate-400 font-mono">dev_alex / Password@123</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Need a separate account?{' '}
            <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
