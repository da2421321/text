import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加全局请求处理
    // 例如添加token：
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 统一处理响应数据
    return response.data;
  },
  error => {
    // 统一处理错误
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

export default request;
