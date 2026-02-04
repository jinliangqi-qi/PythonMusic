import request from '../utils/request';

export const getCategories = (params: any) => {
  return request.get('/categories/', { params });
};

export const createCategory = (data: any) => {
  return request.post('/categories/', data);
};

export const updateCategory = (id: number, data: any) => {
  return request.put(`/categories/${id}`, data);
};

export const deleteCategory = (id: number) => {
  return request.delete(`/categories/${id}`);
};
