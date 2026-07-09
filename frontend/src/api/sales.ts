import request from '../utils/request';

export const getSales = (params: {
  page?: number;
  size?: number;
  customer_id?: number;
  status?: string;
  order_no?: string;
}) => {
  return request.get('/sales/', { params });
};

export const getSalesOrder = (id: number) => {
  return request.get(`/sales/${id}/`);
};

export const createSales = (data: any) => {
  return request.post('/sales/', data);
};

export const updateSales = (id: number, data: any) => {
  return request.put(`/sales/${id}/`, data);
};

export const approveSales = (id: number) => {
  return request.post(`/sales/${id}/approve`);
};

export const shipSales = (id: number) => {
  return request.post(`/sales/${id}/ship`);
};

export const completeSales = (id: number) => {
  return request.post(`/sales/${id}/complete`);
};

export const cancelSales = (id: number) => {
  return request.post(`/sales/${id}/cancel`);
};

export const receiveSalesPayment = (id: number, amount: number) => {
  return request.post(`/sales/${id}/receive-payment`, null, { params: { amount } });
};

export const deleteSales = (id: number) => {
  return request.delete(`/sales/${id}/`);
};