import request from '../utils/request';

export const getUsers = (params: any) => {
  return request.get('/users/', { params });
};

export const createUser = (data: any) => {
  return request.post('/users/', data);
};

export const updateUser = (id: number, data: any) => {
  return request.put(`/users/${id}`, data);
};

export const deleteUser = (id: number) => {
  return request.delete(`/users/${id}`);
};
