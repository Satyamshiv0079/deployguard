import api from './api';
import { ApiResponse, DeploymentEnvironment, DeploymentItem, DeploymentStatus, PagedResponse, Priority } from '../types';

export const deploymentService = {
  getDeployments: async (params?: {
    projectId?: string;
    environment?: DeploymentEnvironment;
    status?: DeploymentStatus;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get<ApiResponse<PagedResponse<DeploymentItem>>>('/deployments', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 25,
        ...params,
      },
    });
    return res.data.data;
  },

  getDeploymentById: async (id: string) => {
    const res = await api.get<ApiResponse<DeploymentItem>>(`/deployments/${id}`);
    return res.data.data;
  },

  requestDeployment: async (data: {
    projectId: string;
    version: string;
    environment: DeploymentEnvironment;
    reason: string;
    changeDescription?: string;
    riskLevel?: Priority;
  }) => {
    const res = await api.post<ApiResponse<DeploymentItem>>('/deployments', data);
    return res.data.data;
  },

  approveDeployment: async (id: string, comments?: string) => {
    const res = await api.post<ApiResponse<DeploymentItem>>(`/deployments/${id}/approve`, { comments });
    return res.data.data;
  },

  rejectDeployment: async (id: string, comments?: string) => {
    const res = await api.post<ApiResponse<DeploymentItem>>(`/deployments/${id}/reject`, { comments });
    return res.data.data;
  },

  executeDeployment: async (id: string) => {
    const res = await api.post<ApiResponse<DeploymentItem>>(`/deployments/${id}/execute`);
    return res.data.data;
  },

  rollbackDeployment: async (id: string, reason: string) => {
    const res = await api.post<ApiResponse<DeploymentItem>>(`/deployments/${id}/rollback`, { reason });
    return res.data.data;
  },
};
