import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { Project, TaskItem } from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import {
  FolderGit2,
  Calendar,
  Users,
  CheckSquare,
  Rocket,
  ShieldAlert,
  ArrowLeft,
  Archive,
} from 'lucide-react';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const { isProjectManager } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projData, taskData] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getTasksByProject(id),
      ]);
      setProject(projData);
      setTasks(taskData);
    } catch (err: any) {
      error('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleArchive = async () => {
    if (!id || !project) return;
    try {
      await projectService.archiveProject(id);
      success(`Project ${project.name} has been archived.`);
      setIsArchiveDialogOpen(false);
      loadData();
    } catch (err: any) {
      error('Failed to archive project.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-36 bg-slate-900 rounded animate-pulse" />
        <div className="h-48 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
        <div className="h-48 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-lg">
        <FolderGit2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Project Not Found</h3>
        <Link
          to="/projects"
          className="mt-3 text-xs text-sky-400 hover:underline inline-flex items-center gap-1 font-mono font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to project portfolios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
        </Link>
      </div>

      {/* Main Project Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-sky-400 font-bold border border-slate-700">
                {project.key}
              </span>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{project.name}</h1>
          </div>

          {isProjectManager && !project.archived && (
            <button
              type="button"
              onClick={() => setIsArchiveDialogOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/60 border border-rose-800/80 rounded hover:bg-rose-900/60 transition flex items-center gap-1.5 self-start shadow-xs"
            >
              <Archive className="w-3.5 h-3.5" /> Archive Project
            </button>
          )}
        </div>

        <p className="text-sm text-slate-300 mt-4 leading-relaxed max-w-4xl">
          {project.description || 'No detailed architecture description registered.'}
        </p>

        {/* Metadata info */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block mb-0.5 font-sans">Project Lead:</span>
            <span className="font-semibold text-slate-200">{project.createdByFullName}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-sans">Start Date:</span>
            <span className="text-slate-300">{project.startDate || 'Unscheduled'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-sans">Target Completion:</span>
            <span className="text-slate-300">{project.targetEndDate || 'Unscheduled'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-sans">Governance Status:</span>
            <span className={project.archived ? 'text-amber-400' : 'text-emerald-400 font-medium'}>
              {project.archived ? 'Archived' : 'Active Oversight'}
            </span>
          </div>
        </div>

        {/* Assigned Team Members */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2 font-mono">
            Assigned Portfolio Members ({project.members?.length || 0})
          </span>
          <div className="flex flex-wrap gap-2">
            {project.members?.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                {m.fullName}
                <span className="text-[10px] text-slate-400">({m.department})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Associated Tasks */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-sky-400" /> Linked Agile Workstreams ({tasks.length})
          </h2>
          <Link
            to="/tasks"
            className="text-xs text-sky-400 hover:text-sky-300 font-medium font-mono"
          >
            Manage in Task Board →
          </Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No tasks currently tracked under this project.
            </div>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850/40 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                    <span>Assignee: <strong className="text-slate-300 font-normal">{t.assigneeFullName || 'Unassigned'}</strong></span>
                    {t.dueDate && (
                      <span className={t.overdue ? 'text-rose-400 font-bold' : ''}>
                        Due: {t.dueDate} {t.overdue && '(OVERDUE)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Archiving */}
      <ConfirmDialog
        isOpen={isArchiveDialogOpen}
        onClose={() => setIsArchiveDialogOpen(false)}
        onConfirm={handleArchive}
        title="Archive Project Portfolio"
        message={`Are you sure you want to archive "${project.name}"? Active tasks and deployment history will be preserved under read-only regulatory audit.`}
        confirmText="Archive Project"
        variant="danger"
      />
    </div>
  );
};
