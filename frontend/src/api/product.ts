import request from '../utils/request';

export const getProducts = (params: {
  page?: number;
  size?: number;
  name?: string;
  sku?: string;
  category?: string;
  status?: string;
}) => {
  return request.get('/products/', { params });
};

export const getProduct = (id: number) => {
  return request.get(`/products/${id}/`);
};

export const createProduct = (data: any) => {
  return request.post('/products/', data);
};

export const updateProduct = (id: number, data: any) => {
  return request.put(`/products/${id}/`, data);
};

export const deleteProduct = (id: number) => {
  return request.delete(`/products/${id}/`);
};

export const getLowStockProducts = () => {
  return request.get('/products/low-stock/');
};

export const getAllProducts = (status?: string) => {
  return request.get('/products/all', { params: { status } });
};