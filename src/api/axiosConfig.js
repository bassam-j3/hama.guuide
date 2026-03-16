import axios from 'axios';

// 🚀 تحديد الرابط الأساسي للباك-إند
const API_BASE_URL = 'http://hamaguide-alb-1031439526.eu-north-1.elb.amazonaws.com/api';
const STORAGE_KEY_PREFIX = "oidc.user:hama.guide:admin"; 

// ==========================================
// 🌟 دالة مساعدة لمعالجة روابط الصور (التي كانت مفقودة)
// ==========================================
export const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const DOMAIN = 'http://hamaguide-alb-1031439526.eu-north-1.elb.amazonaws.com';
    return url.startsWith('/') ? `${DOMAIN}${url}` : `${DOMAIN}/${url}`;
};

// إنشاء نسخة Axios لطلبات الـ REST
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// إنشاء نسخة Axios لطلبات الـ GraphQL
export const graphqlInstance = axios.create({
    baseURL: `${API_BASE_URL}/graphql`, 
    headers: {
        'Content-Type': 'application/json',
    },
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

axiosInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
graphqlInstance.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));


// ==========================================
// 🌟 نظام تجديد الجلسة التلقائي (Refresh Token Interceptor)
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

    // إذا كان الخطأ 401 (انتهت الجلسة) ولم تتم المحاولة من قبل
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

            // طلب التجديد
            const response = await axios.post(`${API_BASE_URL}/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`);
            const newAuthToken = response.data?.token || response.data; 
            
            // 🚀 حفظ التوكن الجديد في الـ Session Storage مع الحفاظ على باقي بيانات المستخدم
            const updatedAuthData = {
                ...authData,
                access_token: newAuthToken
            };
            sessionStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(updatedAuthData));
            
            axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAuthToken}`;
            graphqlInstance.defaults.headers.common.Authorization = `Bearer ${newAuthToken}`;

            processQueue(null, newAuthToken);

            originalRequest.headers.Authorization = `Bearer ${newAuthToken}`;
            return axios(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError, null);
            
            // طرد المستخدم عند فشل التجديد
            sessionStorage.removeItem(STORAGE_KEY_PREFIX);
            window.location.href = '/login';
            
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }

    return Promise.reject(error);
};

axiosInstance.interceptors.response.use((response) => response, responseErrorInterceptor);
graphqlInstance.interceptors.response.use((response) => response, responseErrorInterceptor);

export default axiosInstance;