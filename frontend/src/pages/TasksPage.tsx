import React, { useEffect, useState } from 'react';
import { taskService } from '../services/taskService';
import { projectService, userService } from '../services/projectService';
import { TaskItem, TaskStatus, Priority, Project, UserProfile } from '../types';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import {
  CheckSquare,
  Plus,
  AlertCircle,
  Clock,
  Filter,
  ArrowRight,
  GitCommit,
  CheckCircle2,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as Priority,
    dueDate: '',
    assigneeId: '',
    blockedReason: '',
    dependencyTaskIds: [] as string[],
  });

  const { isDeveloper, isProjectManager } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskRes, projRes, userRes] = await Promise.all([
        taskService.getTasks({
          projectId: selectedProject === 'ALL' ? undefined : selectedProject,
          status: selectedStatus === 'ALL' ? undefined : (selectedStatus as TaskStatus),
          overdue: overdueOnly ? true : undefined,
        }),
        projectService.getProjects(),
        userService.getAllUsers(),
      ]);
      setTasks(taskRes.content);
      setProjects(projRes.content);
      setUsers(userRes);
      if (projRes.content.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: projRes.content[0].id }));
      }
    } catch (err: any) {
      error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProject, selectedStatus, overdueOnly]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.projectId) {
      error('Title and Project are required.');
      return;
    }

    try {
      await taskService.createTask({
        ...formData,
        assigneeId: formData.assigneeId || undefined,
        blockedReason: formData.status === 'BLOCKED' ? formData.blockedReason : undefined,
      });
      success('Task created successfully.');
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        projectId: projects[0]?.id || '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeId: '',
        blockedReason: '',
        dependencyTaskIds: [],
      });
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      success(`Task status updated to ${newStatus}.`);
      loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Agile Task & Sprint Delivery Tracker
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Task dependencies, blockers, and regulatory milestone delivery controls.
          </p>
        </div>

        {isDeveloper && (
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg">
        <Filter className="w-4 h-4 text-slate-500" />

        {/* Project Filter */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
        >
          <option value="ALL">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.key} - {p.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
        >
          <option value="ALL">All Statuses</option>
          <option value="TODO">TO DO</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="BLOCKED">BLOCKED</option>
          <option value="DONE">DONE</option>
        </select>

        {/* Overdue Checkbox */}
        <label className="flex items-center gap-2 text-xs text-slate-300 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-sky-600 focus:ring-0"
          />
          <span className="text-rose-400 font-medium font-mono">Show Overdue Only</span>
        </label>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-lg border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Tasks Match Filter Criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting filter options or create a new sprint task.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-slate-900 border rounded-lg p-4 transition ${
                task.overdue ? 'border-rose-800/80 bg-rose-950/15' : 'border-slate-800 hover:border-slate-750'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-bold border border-slate-700">
                      {task.projectKey}
                    </span>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />

                    {task.overdue && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-rose-300 font-semibold px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800">
                        <AlertCircle className="w-3 h-3 text-rose-400" /> OVERDUE
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white tracking-tight">{task.title}</h3>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                  )}

                  {/* Blocked Reason callout if present */}
                  {task.status === 'BLOCKED' && task.blockedReason && (
                    <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 px-3 py-1.5 rounded flex items-center gap-2 font-mono">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>Blocker: {task.blockedReason}</span>
                    </div>
                  )}

                  {/* Dependencies pill */}
                  {task.dependencies && task.dependencies.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <GitCommit className="w-3 h-3 text-slate-500" />
                      <span>Depends on:</span>
                      {task.dependencies.map((d) => (
                        <span key={d.id} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {d.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs shrink-0 font-mono">
                  <div className="text-right">
                    <div className="text-slate-300 font-sans font-medium">{task.assigneeFullName || 'Unassigned'}</div>
                    <div className="text-[11px] text-slate-400">
                      {task.dueDate ? `Due: ${task.dueDate}` : 'No deadline'}
                    </div>
                  </div>

                  {/* Inline Status Dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => handleQuickStatusChange(task.id, e.target.value as TaskStatus)}
                    className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="TODO">TO DO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Sprint Task"
        subtitle="Track technical deliverable, assignment, and blockers."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              placeholder="e.g., Implement idempotency token check for settlement requests"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Governed Project *
              </label>
              <select
                required
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Assignee
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.department || 'Engineer'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="TODO">TO DO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="DONE">DONE</option>
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

            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {formData.status === 'BLOCKED' && (
            <div>
              <label className="block text-xs font-medium text-rose-400 uppercase tracking-wider">
                Blocked Reason *
              </label>
              <input
                type="text"
                required
                value={formData.blockedReason}
                onChange={(e) => setFormData({ ...formData, blockedReason: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-rose-800 rounded-md text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                placeholder="Detail dependency blocker or external team hindrance..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              placeholder="Technical implementation requirements..."
            />
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
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
