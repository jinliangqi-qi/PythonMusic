import request from '../utils/request';

export const getTags = (params: any) => {
  return request.get('/tags/', { params });
};

export const createTag = (data: any) => {
  return request.post('/tags/', data);
};

export const updateTag = (id: number, data: any) => {
  return request.put(`/tags/${id}`, data);
};

export const deleteTag = (id: number) => {
  return request.delete(`/tags/${id}`);
};
