import request from '../utils/request';

export const getCustomers = (params: {
  page?: number;
  size?: number;
  name?: string;
  status?: string;
}) => {
  return request.get('/customers/', { params });
};

export const getCustomer = (id: number) => {
  return request.get(`/customers/${id}/`);
};

export const createCustomer = (data: any) => {
  return request.post('/customers/', data);
};

export const updateCustomer = (id: number, data: any) => {
  return request.put(`/customers/${id}/`, data);
};

export const deleteCustomer = (id: number) => {
  return request.delete(`/customers/${id}/`);
};