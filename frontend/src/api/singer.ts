import request from '../utils/request';

export const getSingers = (params: any) => {
  return request.get('/singers/', { params });
};

export const createSinger = (data: any) => {
  return request.post('/singers/', data);
};

export const updateSinger = (id: number, data: any) => {
  return request.put(`/singers/${id}`, data);
};

export const deleteSinger = (id: number) => {
  return request.delete(`/singers/${id}`);
};
