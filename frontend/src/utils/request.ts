import axios from 'axios';
import { message } from './globalAntd';
import { useUserStore } from '../store/useUserStore';

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 Zustand Store 获取 Token
    const { token } = useUserStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    // 后端格式: { code: 200, message: 'success', data: ... }
    // 如果是列表分页: { code: 200, message: 'success', data: { list: [], total: ... } }
    
    // 如果 code 不是 200，视为业务错误 (根据后端约定，这里假设 http status 200 但 code != 200 也是错误)
    if (data.code !== undefined && data.code !== 200) {
        // 使用全局 message 实例（如果已初始化）
        message?.error(data.message || '业务处理失败');
        return Promise.reject(new Error(data.message || 'Error'));
    }

    // 直接返回 data 字段 (业务数据)，或者返回整个 data (包含 code/message)
    // 这里为了方便，如果 data 字段存在则返回 data.data，否则返回整个响应体
    // 但考虑到分页结构 PageResponse data 里面还有 list/total，
    // 统一返回 data.data 比较方便，如果 data.data 为 null，则返回 data
    return data.data !== undefined ? data.data : data;
  },
  (error) => {
    const { response } = error;
    if (response) {
      const { status, data } = response;
      const errorMsg = data?.message || data?.detail || '请求失败';

      if (status === 401) {
        // Token 过期或未登录
        message?.error('登录已过期，请重新登录');
        useUserStore.getState().clearUser();
        // 这里可以做跳转，或者由页面组件监听状态变化
        window.location.href = '/login';
      } else if (status === 403) {
        message?.error('没有权限执行此操作');
      } else if (status === 404) {
        message?.error('请求资源不存在');
      } else if (status === 500) {
        message?.error('服务器内部错误');
      } else {
        message?.error(errorMsg);
      }
    } else {
        // 忽略特定的网络错误（如被取消的请求或 ORB 拦截），避免弹窗干扰
        if (error.message !== 'canceled' && error.code !== 'ERR_BLOCKED_BY_ORB') {
             message?.error('网络连接失败，请检查网络');
        }
    }
    return Promise.reject(error);
  }
);

export default request;
