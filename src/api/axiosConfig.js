import axios from 'axios';
import toast from 'react-hot-toast';

const isDev = import.meta.env.DEV;
const AWS_SERVER_URL = "http://hamaguide-alb-1031439526.eu-north-1.elb.amazonaws.com";
const API_BASE = isDev ? '/api' : `${AWS_SERVER_URL}/api`; 
const GRAPHQL_BASE = isDev ? '/graphql' : `${AWS_SERVER_URL}/graphql`;

const TIMEOUT_DURATION = 60000; 
const STORAGE_KEY = "oidc.user:hama.guide:admin"; 

const axiosInstance = axios.create({
  baseURL: API_BASE, 
  timeout: TIMEOUT_DURATION,
  headers: {
    'Accept': 'application/json',
  },
});

export const graphqlInstance = axios.create({
  baseURL: GRAPHQL_BASE,
  timeout: TIMEOUT_DURATION,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthToken = () => {
  try {
    const storedData = sessionStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      return parsedData.access_token || parsedData.token || null;
    }
  } catch (error) {
    console.error("Error reading token", error);
  }
  return null;
};

const requestInterceptor = (config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
};

axiosInstance.interceptors.request.use(requestInterceptor);
graphqlInstance.interceptors.request.use(requestInterceptor);


// ==========================================
// 🚀 نظام التجديد التلقائي للتوكن (Refresh Token Logic)
// ==========================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.status === 204) return true;
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'succeeded' in resData) {
      if (resData.succeeded) return resData.data;
      throw new Error(resData.message || 'Error occurred');
    }
    return resData;
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. إذا كان الخطأ 401 ولم نقم بمحاولة التجديد من قبل لهذا الطلب
    if (error.response?.status === 401 && !originalRequest._retry) {
        
        // إذا كنا نقوم بالتجديد حالياً (لطلب آخر)، ضع هذا الطلب في الطابور
        if (isRefreshing) {
            return new Promise(function(resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers.Authorization = 'Bearer ' + token;
                return axiosInstance(originalRequest); // إعادة محاولة الطلب
            }).catch(err => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const storedData = sessionStorage.getItem(STORAGE_KEY);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                const refreshToken = parsedData.refresh_token || parsedData.refreshToken;

                if (refreshToken) {
                    // ⚠️ تحذير: نستخدم axios.post مباشرة (وليس axiosInstance) لكي لا ندخل في حلقة مفرغة (Infinite Loop)
                    const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, null, {
                        params: { refreshToken: refreshToken }
                    });

                    // استخراج التوكن الجديد
                    let resData = refreshResponse.data;
                    if (resData && resData.succeeded !== undefined) resData = resData.data;
                    
                    const newToken = resData?.token || resData?.access_token;
                    const newRefreshToken = resData?.refreshToken || resData?.refresh_token || refreshToken;

                    if (newToken) {
                        // حفظ التوكن الجديد في الـ SessionStorage
                        parsedData.access_token = newToken;
                        parsedData.refresh_token = newRefreshToken;
                        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));

                        // إخبار كل الطلبات المنتظرة في الطابور بأن التجديد نجح
                        processQueue(null, newToken);
                        
                        // إعادة إرسال الطلب الأصلي الذي فشل بسببه التوكن
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return axiosInstance(originalRequest);
                    }
                }
            }
            throw new Error("No valid refresh token");

        } catch (refreshError) {
            // فشل التجديد نهائياً (انتهت صلاحية الجلسة بالكامل)
            processQueue(refreshError, null);
            sessionStorage.removeItem(STORAGE_KEY);
            toast.error("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.");
            setTimeout(() => { window.location.href = '/login'; }, 1500);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false; // تحرير القفل
        }
    }
    
    // 2. معالجة أخطاء الصلاحيات (403)
    else if (error.response?.status === 403) {
        toast.error("خطأ (403): ليس لديك صلاحية كافية للقيام بهذا الإجراء!");
    }
    
    // 3. معالجة أخطاء المدخلات (400 Bad Request) وعرضها بوضوح
    else if (error.response?.status === 400) {
        const data = error.response.data;
        if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat().join('\n');
            toast.error(`خطأ في البيانات:\n${errorMessages}`, { duration: 5000 });
        } else if (data?.message || data?.detail) {
            toast.error(`خطأ: ${data.message || data.detail}`);
        }
    }
    
    return Promise.reject(error);
  }
);

// استخراج رابط الصورة
export const getImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // قم بتحديث الهوست هنا أيضاً
const AWS_HOST = "hamaguide-alb-1031439526.eu-north-1.elb.amazonaws.com"; 
  let cleanPath = path.replace(`http://${AWS_HOST}`, '').replace(`https://${AWS_HOST}`, '');
  
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
  return `${AWS_SERVER_URL}${cleanPath}`; 
};

export default axiosInstance;