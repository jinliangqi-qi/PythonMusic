import request from '../utils/request';

export const getInventory = (params: {
  page?: number;
  size?: number;
  product_id?: number;
  change_type?: string;
}) => {
  return request.get('/inventory/', { params });
};

export const getInventoryRecord = (id: number) => {
  return request.get(`/inventory/${id}/`);
};

export const adjustInventory = (data: any) => {
  return request.post('/inventory/adjust', data);
};

export const inventoryCheck = (params: {
  product_id: number;
  actual_qty: number;
  remark?: string;
}) => {
  return request.post('/inventory/check', null, { params });
};