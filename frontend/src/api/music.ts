import request from '../utils/request';

export const getMusics = (params: any) => {
  return request.get('/musics/', { params });
};

export const createMusic = (data: any) => {
  return request.post('/musics/', data);
};

export const updateMusic = (id: number, data: any) => {
  return request.put(`/musics/${id}`, data);
};

export const deleteMusic = (id: number) => {
  return request.delete(`/musics/${id}`);
};

export const deleteMusicsBatch = (ids: number[]) => {
  return request.delete('/musics/batch', {
      params: { ids },
      paramsSerializer: {
          indexes: null // 让数组序列化为 ids=1&ids=2 格式 (axios 默认行为可能不同，需注意)
      }
  });
};

// 审核接口
export const auditMusic = (id: number, status: 'active' | 'rejected' | 'pending') => {
  return request.patch(`/musics/${id}/audit`, null, {
      params: { status }
  });
};

export const uploadFile = (data: FormData) => {
  return request.post('/common/upload', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
