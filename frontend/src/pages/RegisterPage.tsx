import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Shield, Lock, User, Mail, Building, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    department: 'Software Engineering',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.fullName) {
      error('Please complete all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        department: formData.department,
        roles: ['ROLE_DEVELOPER'],
      });
      success('Account registered successfully with Developer clearance. Please sign in.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Please check inputs.';
      error(msg);
    } finally {
      setIsLoading(false);
    }
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
          DeployGuard Account Onboarding
        </h2>
        <p className="mt-1 text-center text-xs font-mono uppercase tracking-widest text-slate-400">
          Role-Based Access Control Clearance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-lg sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Full Legal Name *
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  placeholder="Eleanor Vance"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Corporate Username *
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  placeholder="eleanor_v"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Corporate Email Address *
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  placeholder="eleanor.vance@deployguard.internal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Password *
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Department / Business Unit
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Standard Clearance Callout (No client-side privilege escalation) */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold font-mono text-[11px] mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ASSIGNED CLEARANCE: DEVELOPER
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Standard engineering clearance will be provisioned. Privilege elevations (Reviewer, PM, Admin) require an authorized PAM/IAM change request ticket.
              </p>
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
                    Complete Registration <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an active account?{' '}
            <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
