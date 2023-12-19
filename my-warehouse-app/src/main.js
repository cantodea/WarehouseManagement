import { createApp } from 'vue';
import App from './App.vue';
import axios from 'axios';

// 设置 Axios 的全局默认值
axios.defaults.baseURL = 'http://192.168.1.7:3000';

// Axios 请求拦截器
axios.interceptors.request.use(function (config) {
    // 从 localStorage 获取 JWT
    const token = localStorage.getItem('token');
    console.log("Token from localStorage:", token); // 添加这行来检查 token
    if (token) {
        // 如果存在 JWT，则将其添加到请求头中
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});

const app = createApp(App);

// 将 axios 设置为全局可用
app.config.globalProperties.$axios = axios;

app.mount('#app');
