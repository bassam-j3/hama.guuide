import axios from 'axios';
import toast from 'react-hot-toast';

// 🚀 الكود الذكي للتفريق بين بيئة التطوير والإنتاج
const isDev = import.meta.env.DEV;
const AWS_SERVER_URL = "http://hamaguide-alb-157671246.eu-north-1.elb.amazonaws.com/"; // ملاحظة هامة بالأسفل حول الـ HTTP

const API_BASE = isDev ? '/api' : `${AWS_SERVER_URL}/api`; 
const GRAPHQL_BASE = isDev ? '/graphql' : `${AWS_SERVER_URL}/graphql`;

const TIMEOUT_DURATION = 60000; 
const STORAGE_KEY = "oidc.user:hama.guide:admin"; 

// ... (باقي الملف يبقى كما هو تماماً بدون تغيير) ...

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

// 🚀 Response Interceptor مع معالجة ذكية للأخطاء 401 و 403
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
  (error) => {
    if (error.response?.status === 401) {
        toast.error("انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.");
        setTimeout(() => { window.location.href = '/login'; }, 2000);
    }
    // 🚀 اصطياد الـ 403 بأناقة
    else if (error.response?.status === 403) {
        toast.error("خطأ (403): ليس لديك صلاحية كافية للقيام بهذا الإجراء!");
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  
  // 🚀 إذا كان الرابط قادماً من S3 أو يبدأ بـ http/https، نعيده كما هو بدون أي تدخل
  if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
  }

  // ⚠️ الكود القديم للتعامل مع الصور التي تم رفعها قبل استخدام S3 (إن وجدت)
  const AWS_SERVER_URL = "http://hamaguide-alb-157671246.eu-north-1.elb.amazonaws.com"; 
  let cleanPath = path.replace(`http://${AWS_SERVER_URL}`, '').replace(`https://${AWS_SERVER_URL}`, '');
  
  if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
  return `${AWS_SERVER_URL}${cleanPath}`; 
};

export default axiosInstance;