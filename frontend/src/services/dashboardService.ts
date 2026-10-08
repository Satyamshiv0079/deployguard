import api from './api';
import { ApiResponse, DashboardSummary } from '../types';

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
};
