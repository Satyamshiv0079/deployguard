import React, { useEffect, useState } from 'react';
import { projectService, userService } from '../services/projectService';
import { Project, ProjectStatus, Priority, UserProfile } from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Users,
  CheckSquare,
  ShieldAlert,
  Rocket,
  Archive,
  ArrowRight,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Create Project form state
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    status: 'PLANNED' as ProjectStatus,
    priority: 'MEDIUM' as Priority,
    startDate: '',
    targetEndDate: '',
    memberIds: [] as string[],
  });

  const { isProjectManager } = useAuth();
  const { success, error } = useToast();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const filter = statusFilter === 'ALL' ? undefined : (statusFilter as ProjectStatus);
      const res = await projectService.getProjects(filter);
      setProjects(res.content);
    } catch (err: any) {
      error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [statusFilter]);

  const openCreateModal = async () => {
    try {
      const uList = await userService.getAllUsers();
      setUsers(uList);
      setIsCreateModalOpen(true);
    } catch (err) {
      error('Could not load platform users.');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.key) {
      error('Please provide project name and key.');
      return;
    }

    try {
      await projectService.createProject(formData);
      success('Project initialized successfully.');
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        key: '',
        description: '',
        status: 'PLANNED',
        priority: 'MEDIUM',
        startDate: '',
        targetEndDate: '',
        memberIds: [],
      });
      loadProjects();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to initialize project.');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Enterprise Project Portfolios
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed system architectures, release schedules, and core banking workstreams.
          </p>
        </div>

        {isProjectManager && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Initialize Project
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by name or code (e.g., CSG-01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">PLANNED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="AT_RISK">AT RISK</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center max-w-lg mx-auto">
          <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Governed Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `No projects match "${searchQuery}". Try clearing search filters.`
              : 'Initialize your first release-governed project to begin tracking.'}
          </p>
          {isProjectManager && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition inline-flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Initialize Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-750 transition shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold border border-slate-700">
                    {p.key}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={p.priority} />
                    <StatusBadge status={p.status} />
                  </div>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight mt-2">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {p.description || 'No description provided.'}
                </p>

                {/* Team Members */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.members?.length || 1} team members</span>
                  </div>
                  <span>
                    Lead:{' '}
                    <strong className="text-slate-300 font-normal">
                      {p.createdByFullName?.split(' ')[0]}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  {p.targetEndDate ? `Target: ${p.targetEndDate}` : 'Ongoing'}
                </div>

                <Link
                  to={`/projects/${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 font-mono"
                >
                  Inspect <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {/* Intentional Quick-Add Card when dataset is small (< 3) and user is PM */}
          {filteredProjects.length < 3 && isProjectManager && (
            <div
              onClick={openCreateModal}
              className="bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition group min-h-[220px]"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-sky-400 group-hover:bg-slate-750 transition mb-2">
                <Plus className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                Initialize Another Project
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Add another service or core system to the governance boundary.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize Governed Project"
        subtitle="Define architecture portfolio parameters and milestone schedule."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              placeholder="e.g., ISO 20022 Clearing Engine"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Project Key (Uppercase Identifier) *
            </label>
            <input
              type="text"
              required
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              placeholder="e.g., CLR-04"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              placeholder="System objectives, scope and architecture notes..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="PLANNED">PLANNED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="AT_RISK">AT RISK</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Target End Date
              </label>
              <input
                type="date"
                value={formData.targetEndDate}
                onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 rounded-md hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition shadow-xs"
            >
              Initialize Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
