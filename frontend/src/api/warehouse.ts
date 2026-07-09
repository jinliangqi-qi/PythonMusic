import request from '../utils/request';

export const getWarehouses = (params: {
  page?: number;
  size?: number;
  name?: string;
  status?: string;
}) => {
  return request.get('/warehouses/', { params });
};

export const getAllWarehouses = (status?: string) => {
  return request.get('/warehouses/all', { params: { status } });
};

export const getWarehouse = (id: number) => {
  return request.get(`/warehouses/${id}/`);
};

export const createWarehouse = (data: any) => {
  return request.post('/warehouses/', data);
};

export const updateWarehouse = (id: number, data: any) => {
  return request.put(`/warehouses/${id}/`, data);
};

export const deleteWarehouse = (id: number) => {
  return request.delete(`/warehouses/${id}/`);
};
