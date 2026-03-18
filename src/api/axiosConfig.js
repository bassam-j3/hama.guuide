import axios from 'axios';

// قراءة الرابط من ملف .env ديناميكياً
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const STORAGE_KEY_PREFIX = "oidc.user:hama.guide:admin"; 

// ==========================================
// 🌟 دالة مساعدة لمعالجة روابط الصور
// ==========================================
export const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    // استخراج الدومين من الرابط الأساسي برمجياً
    const DOMAIN = API_BASE_URL.replace(/\/api\/?$/i, '');
    return url.startsWith('/') ? `${DOMAIN}${url}` : `${DOMAIN}/${url}`;
};

// 1. إنشاء نسخة Axios لطلبات الـ REST العادية
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. إنشاء نسخة Axios لطلبات الـ GraphQL
const GRAPHQL_DOMAIN = API_BASE_URL.replace(/\/api\/?$/i, '');
export const graphqlInstance = axios.create({
    baseURL: `${GRAPHQL_DOMAIN}/graphql`, 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 3. 🚀 إنشاء نسخة Axios مخصصة لرفع الملفات (بدون إجبار Content-Type)
export const axiosUploadInstance = axios.create({
    baseURL: API_BASE_URL,
    // المتصفح سيتكفل تلقائياً بإضافة multipart/form-data مع الـ Boundary
});

// دالة مساعدة لقراءة كائن الـ Auth من الـ Session Storage
const getAuthData = () => {
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY_PREFIX);
        return storedData ? JSON.parse(storedData) : null;
    } catch {
        return null;
    }
};

// ==========================================
// 🌟 نظام اعتراض الطلبات (Request Interceptor)
// ==========================================
const requestInterceptor = (config) => {
    const authData = getAuthData();
    if (authData && authData.access_token) {
        config.headers.Authorization = `Bearer ${authData.access_token}`;
    }
    return config;
};

// تطبيق الـ Interceptor على جميع النسخ
axiosInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
graphqlInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
axiosUploadInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error)); // 🚀 تطبيقه هنا لحماية الرفع

// ==========================================
// 🌟 نظام تجديد الجلسة التلقائي (Refresh Token)
// ==========================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const responseErrorInterceptor = async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            return new Promise(function(resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axios(originalRequest);
            }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const authData = getAuthData();
            const refreshToken = authData?.refresh_token;

            if (!refreshToken) throw new Error("لا يوجد Refresh Token");

            const response = await axios.post(`${API_BASE_URL}/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`);
            const newAuthToken = response.data?.token || response.data; 
            
            const updatedAuthData = {
                ...authData,
                access_token: newAuthToken
            };
            sessionStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(updatedAuthData));
            
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAuthToken}`;
            graphqlInstance.defaults.headers.common.Authorization = `Bearer ${newAuthToken}`;
            axiosUploadInstance.defaults.headers.common.Authorization = `Bearer ${newAuthToken}`; // 🚀 التحديث هنا أيضاً

            processQueue(null, newAuthToken);

            originalRequest.headers.Authorization = `Bearer ${newAuthToken}`;
            return axios(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError, null);
            sessionStorage.removeItem(STORAGE_KEY_PREFIX);
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
    return Promise.reject(error);
};

// تطبيق الـ Error Interceptor على جميع النسخ
axiosInstance.interceptors.response.use((response) => response, responseErrorInterceptor);
graphqlInstance.interceptors.response.use((response) => response, responseErrorInterceptor);
axiosUploadInstance.interceptors.response.use((response) => response, responseErrorInterceptor); // 🚀 تطبيق الـ Queue & Refresh على الرفع

export default axiosInstance;