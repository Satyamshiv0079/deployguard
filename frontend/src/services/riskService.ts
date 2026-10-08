import api from './api';
import { ApiResponse, AuditLogItem, DashboardSummary, PagedResponse, RiskItem, RiskMitigation, RiskSeverity, RiskStatus } from '../types';

export const riskService = {
  getRisks: async (params?: {
    projectId?: string;
    severity?: RiskSeverity;
    status?: RiskStatus;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get<ApiResponse<PagedResponse<RiskItem>>>('/risks', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 25,
        ...params,
      },
    });
    return res.data.data;
  },

  getUnresolvedRisks: async () => {
    const res = await api.get<ApiResponse<RiskItem[]>>('/risks/unresolved');
    return res.data.data;
  },

  getRiskById: async (id: string) => {
    const res = await api.get<ApiResponse<RiskItem>>(`/risks/${id}`);
    return res.data.data;
  },

  createRisk: async (data: {
    title: string;
    description?: string;
    projectId: string;
    ownerId?: string;
    severity?: RiskSeverity;
    probability: number;
    impact: number;
    mitigationPlan?: string;
    dueDate?: string;
  }) => {
    const res = await api.post<ApiResponse<RiskItem>>('/risks', data);
    return res.data.data;
  },

  updateRisk: async (id: string, data: Partial<RiskItem>) => {
    const res = await api.put<ApiResponse<RiskItem>>(`/risks/${id}`, data);
    return res.data.data;
  },

  addMitigation: async (riskId: string, data: {
    actionTitle: string;
    actionDescription?: string;
    ownerId?: string;
    completed?: boolean;
  }) => {
    const res = await api.post<ApiResponse<RiskMitigation>>(`/risks/${riskId}/mitigations`, data);
    return res.data.data;
  },

  deleteRisk: async (id: string) => {
    const res = await api.delete<ApiResponse<void>>(`/risks/${id}`);
    return res.data;
  },
};

export const auditService = {
  getAuditLogs: async (params?: {
    username?: string;
    action?: string;
    entityType?: string;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get<ApiResponse<PagedResponse<AuditLogItem>>>('/audit-logs', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 25,
        ...params,
      },
    });
    return res.data.data;
  },
};

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
};
