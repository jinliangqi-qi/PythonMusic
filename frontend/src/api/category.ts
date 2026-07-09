import request from '../utils/request';

export const getCategories = (params: {
  page?: number;
  size?: number;
  name?: string;
  status?: string;
}) => {
  return request.get('/categories/', { params });
};

export const getAllCategories = (status?: string) => {
  return request.get('/categories/all', { params: { status } });
};

export const getCategory = (id: number) => {
  return request.get(`/categories/${id}/`);
};

export const createCategory = (data: any) => {
  return request.post('/categories/', data);
};

export const updateCategory = (id: number, data: any) => {
  return request.put(`/categories/${id}/`, data);
};

export const deleteCategory = (id: number) => {
  return request.delete(`/categories/${id}/`);
};
