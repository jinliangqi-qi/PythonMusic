import request from '../utils/request';

export const getAlbums = (params: any) => {
  return request.get('/albums/', { params });
};

export const createAlbum = (data: any) => {
  return request.post('/albums/', data);
};

export const updateAlbum = (id: number, data: any) => {
  return request.put(`/albums/${id}`, data);
};

export const deleteAlbum = (id: number) => {
  return request.delete(`/albums/${id}`);
};
