import request from '../utils/request';

export const getSysLogs = (params: any) => {
  return request.get('/sys_logs/', { params });
};

export const deleteSysLog = (id: number) => {
  return request.delete(`/sys_logs/${id}`);
};
