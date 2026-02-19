import axios, { type AxiosRequestConfig } from 'axios';

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

instance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(err.response?.data || err.message);
  }
);

/** 封装：实际返回的是 res.data，类型为 T */
export interface Request {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

const request = instance as unknown as Request;
export default request;
