import axios from 'axios';
import toast from 'react-hot-toast';

const isDev = import.meta.env.DEV;
const AWS_SERVER_URL = "http://hamaguide-alb-1031439526.eu-north-1.elb.amazonaws.com";
const API_BASE = isDev ? '/api' : `${AWS_SERVER_URL}/api`; 
const GRAPHQL_BASE = isDev ? '/graphql' : `${AWS_SERVER_URL}/graphql`;

const TIMEOUT_DURATION = 60000; 
const STORAGE_KEY = "oidc.user:hama.guide:admin"; 

// 🚀 1. إنشاء نُسخ Axios
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

// 🚀 2. قراءة التوكن بأمان
const getAuthData = () => {
  try {
    const storedData = sessionStorage.getItem(STORAGE_KEY);
    if (storedData) return JSON.parse(storedData);
  } catch (error) {
    console.error("Error reading auth data", error);
  }
  return null;
};

// 🚀 3. حقن التوكن في كل طلب (Request Interceptor)
const requestInterceptor = (config) => {
  const authData = getAuthData();
  const token = authData?.access_token || authData?.token || null;
  
  if (token) {
      config.headers.Authorization = `Bearer ${token}`;
  }
  
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
// 🚀 نظام التجديد الصامت (Silent Token Refresh)
// ==========================================
let isRefreshing = false;
let failedQueue = [];

// دالة لتفريغ الطابور بعد نجاح أو فشل التجديد
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const responseInterceptor = async (error) => {
  const originalRequest = error.config;

  // أ. إذا كان الخطأ 401 (غير مصرح) ولم نحاول تجديد هذا الطلب من قبل
  if (error.response?.status === 401 && !originalRequest._retry) {
      
      // إذا كان هناك طلب آخر يقوم بالتجديد الآن، ضع هذا الطلب في الطابور
      if (isRefreshing) {
          return new Promise(function(resolve, reject) {
              failedQueue.push({ resolve, reject });
          }).then(token => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              return axiosInstance(originalRequest); 
          }).catch(err => {
              return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
          const authData = getAuthData();
          const refreshToken = authData?.refresh_token || authData?.refreshToken;

          if (refreshToken) {
              // ⚠️ نستخدم axios العادي وليس axiosInstance لتجنب الحلقات المفرغة
              const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, null, {
                  params: { refreshToken: refreshToken }
              });

              // بناءً على هيكل استجابتك (Swagger)
              let resData = refreshResponse.data;
              if (resData && typeof resData === 'object' && 'succeeded' in resData) {
                  resData = resData.data;
              }
              
              const newToken = resData?.token || resData?.access_token;
              const newRefreshToken = resData?.refreshToken || resData?.refresh_token || refreshToken;

              if (newToken) {
                  // تحديث الـ Session Storage
                  const updatedData = { ...authData, access_token: newToken, refresh_token: newRefreshToken };
                  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

                  // تحرير الطابور وتمرير التوكن الجديد
                  processQueue(null, newToken);
                  
                  // إعادة إرسال الطلب الأصلي الذي فشل
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  return axiosInstance(originalRequest);
              }
          }
          throw new Error("No valid refresh token");

      } catch (refreshError) {
          // إذا فشل التجديد نهائياً، أفرغ الجلسة واطرد المستخدم
          processQueue(refreshError, null);
          sessionStorage.removeItem(STORAGE_KEY);
          toast.error("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.");
          setTimeout(() => { window.location.href = '/login'; }, 1500);
          return Promise.reject(refreshError);
      } finally {
          isRefreshing = false; 
      }
  }
  
  // ب. معالجة أخطاء الصلاحيات (403)
  else if (error.response?.status === 403) {
      toast.error("خطأ (403): ليس لديك صلاحية للقيام بهذا الإجراء!");
  }
  
  // ج. معالجة أخطاء المدخلات (400 Bad Request) لقراءتها بوضوح
  else if (error.response?.status === 400) {
      const data = error.response.data;
      if (data?.Errors && Array.isArray(data.Errors)) {
          const errorMessages = data.Errors.map(e => e.description).join('\n');
          toast.error(errorMessages, { duration: 5000 });
      } else if (data?.errors) {
          const errorMessages = Object.values(data.errors).flat().join('\n');
          toast.error(`خطأ في البيانات:\n${errorMessages}`, { duration: 5000 });
      } else if (data?.message || data?.detail) {
          toast.error(`خطأ: ${data.message || data.detail}`);
      }
  }
  
  return Promise.reject(error);
};

// 🚀 ربط معالج الاستجابة بـ axiosInstance
axiosInstance.interceptors.response.use(
  (response) => {
    // بناءً على Swagger، نفكك التغليفة إذا كانت موجودة
    if (response.status === 204) return true;
    const resData = response.data;
    if (resData && typeof resData === 'object' && 'succeeded' in resData) {
      if (resData.succeeded) return resData.data;
      throw new Error(resData.message || 'Error occurred');
    }
    return resData;
  },
  responseInterceptor
);

// 🚀 دالة معالجة روابط الصور
export const getImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const AWS_HOST = "hamaguide-alb-1031439526.eu-north-1.elb.amazonaws.com"; 
  let cleanPath = path.replace(`http://${AWS_HOST}`, '').replace(`https://${AWS_HOST}`, '');
  
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
  return `${AWS_SERVER_URL}${cleanPath}`; 
};

export default axiosInstance;