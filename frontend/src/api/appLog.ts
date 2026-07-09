import request from '../utils/request';

export const getAppLogs = (params: {
  page?: number;
  size?: number;
  level?: string;
  source?: string;
  user_id?: number;
  environment?: string;
  keyword?: string;
  days?: number;
}) => {
  return request.get('/app-logs/', { params });
};

export const getAppLog = (id: number) => {
  return request.get(`/app-logs/${id}/`);
};

export const getAppLogStats = (hours: number = 24) => {
  return request.get('/app-logs/stats', { params: { hours } });
};

export const deleteAppLog = (id: number) => {
  return request.delete(`/app-logs/${id}/`);
};

export const cleanupOldLogs = (days: number = 30) => {
  return request.delete('/app-logs/cleanup', { params: { days } });
};