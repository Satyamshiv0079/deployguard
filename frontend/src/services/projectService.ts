import api from './api';
import { ApiResponse, PagedResponse, Project, ProjectStatus, UserProfile } from '../types';

export const projectService = {
  getProjects: async (status?: ProjectStatus, archived?: boolean, page = 0, size = 20) => {
    const params: Record<string, any> = { page, size };
    if (status) params.status = status;
    if (archived !== undefined) params.archived = archived;
    const res = await api.get<ApiResponse<PagedResponse<Project>>>('/projects', { params });
    return res.data.data;
  },

  getProjectById: async (id: string) => {
    const res = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data.data;
  },

  createProject: async (data: {
    name: string;
    key: string;
    description?: string;
    status?: ProjectStatus;
    priority?: string;
    startDate?: string;
    targetEndDate?: string;
    memberIds?: string[];
  }) => {
    const res = await api.post<ApiResponse<Project>>('/projects', data);
    return res.data.data;
  },

  updateProject: async (id: string, data: Partial<Project> & { memberIds?: string[] }) => {
    const res = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return res.data.data;
  },

  archiveProject: async (id: string) => {
    const res = await api.post<ApiResponse<void>>(`/projects/${id}/archive`);
    return res.data;
  },

  deleteProject: async (id: string) => {
    const res = await api.delete<ApiResponse<void>>(`/projects/${id}`);
    return res.data;
  },
};

export const userService = {
  getAllUsers: async () => {
    const res = await api.get<ApiResponse<UserProfile[]>>('/users');
    return res.data.data;
  },
};
