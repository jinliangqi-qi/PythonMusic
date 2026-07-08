import request from '../utils/request';

export const getSuppliers = (params: {
  page?: number;
  size?: number;
  name?: string;
  status?: string;
}) => {
  return request.get('/suppliers/', { params });
};

export const getSupplier = (id: number) => {
  return request.get(`/suppliers/${id}/`);
};

export const createSupplier = (data: any) => {
  return request.post('/suppliers/', data);
};

export const updateSupplier = (id: number, data: any) => {
  return request.put(`/suppliers/${id}/`, data);
};

export const deleteSupplier = (id: number) => {
  return request.delete(`/suppliers/${id}/`);
};