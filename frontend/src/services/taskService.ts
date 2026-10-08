import api from './api';
import { ApiResponse, PagedResponse, Priority, TaskItem, TaskStatus } from '../types';

export const taskService = {
  getTasks: async (params?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    overdue?: boolean;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get<ApiResponse<PagedResponse<TaskItem>>>('/tasks', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 25,
        ...params,
      },
    });
    return res.data.data;
  },

  getTasksByProject: async (projectId: string) => {
    const res = await api.get<ApiResponse<TaskItem[]>>(`/projects/${projectId}/tasks`);
    return res.data.data;
  },

  getTaskById: async (id: string) => {
    const res = await api.get<ApiResponse<TaskItem>>(`/tasks/${id}`);
    return res.data.data;
  },

  createTask: async (data: {
    title: string;
    description?: string;
    projectId: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: string;
    assigneeId?: string;
    blockedReason?: string;
    dependencyTaskIds?: string[];
  }) => {
    const res = await api.post<ApiResponse<TaskItem>>('/tasks', data);
    return res.data.data;
  },

  updateTask: async (id: string, data: Partial<TaskItem> & { dependencyTaskIds?: string[] }) => {
    const res = await api.put<ApiResponse<TaskItem>>(`/tasks/${id}`, data);
    return res.data.data;
  },

  deleteTask: async (id: string) => {
    const res = await api.delete<ApiResponse<void>>(`/tasks/${id}`);
    return res.data;
  },
};
