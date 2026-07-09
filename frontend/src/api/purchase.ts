import request from '../utils/request';

export const getPurchases = (params: {
  page?: number;
  size?: number;
  supplier_id?: number;
  status?: string;
  order_no?: string;
}) => {
  return request.get('/purchases/', { params });
};

export const getPurchase = (id: number) => {
  return request.get(`/purchases/${id}/`);
};

export const createPurchase = (data: any) => {
  return request.post('/purchases/', data);
};

export const updatePurchase = (id: number, data: any) => {
  return request.put(`/purchases/${id}/`, data);
};

export const approvePurchase = (id: number) => {
  return request.post(`/purchases/${id}/approve`);
};

export const receivePurchase = (id: number) => {
  return request.post(`/purchases/${id}/receive`);
};

export const cancelPurchase = (id: number) => {
  return request.post(`/purchases/${id}/cancel`);
};

export const payPurchase = (id: number, amount: number) => {
  return request.post(`/purchases/${id}/pay`, null, { params: { amount } });
};

export const deletePurchase = (id: number) => {
  return request.delete(`/purchases/${id}/`);
};