import request from '../utils/request';

export const login = (data: any) => {
  return request.post('/auth/login', data);
};

export const getUserInfo = () => {
  return request.get('/auth/me');
};

export const forgotPassword = (email: string) => {
  return request.post('/auth/forgot-password', { email });
};

export const resetPassword = (data: any) => {
  return request.post('/auth/reset-password', data);
};
