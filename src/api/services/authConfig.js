import axiosInstance from '../axiosConfig';

const AUTH_BASE = '/auth';
const STORAGE_KEY_PREFIX = "oidc.user:hama.guide:admin"; 

export const authService = {

  getCurrentUser: () => {
    try {
      const storedData = sessionStorage.getItem(STORAGE_KEY_PREFIX);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.access_token) return parsedData.profile;
      }
    } catch (e) {}
    return null;
  },

  login: async (userName, password) => {
    const response = await axiosInstance.post(`${AUTH_BASE}/login`, { userName, password });
    const authData = {
      access_token: response.token || response.data?.token,
      refresh_token: response.refreshToken || response.data?.refreshToken,
      profile: response.user || response.data?.user,
      token_type: "Bearer"
    };
    sessionStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(authData));
    return authData;
  },

  logout: () => {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX);
  },

  register: async (userData) => {
    return await axiosInstance.post(`${AUTH_BASE}/register`, userData);
  },

  refresh: async (token) => {
    return await axiosInstance.post(`${AUTH_BASE}/refresh`, null, { params: { refreshToken: token } });
  },

  // 🚀 جلب بيانات الملف الشخصي (Swagger: GET /api/auth/me)
  getMe: async () => {
    return await axiosInstance.get(`${AUTH_BASE}/me`);
  },

  // 🚀 طلب إعادة تعيين الباسورد (Swagger: POST /api/auth/request-password-reset)
  requestPasswordReset: async (email) => {
    return await axiosInstance.post(`${AUTH_BASE}/request-password-reset`, null, { params: { email } });
  },

  // 🚀 تغيير الإيميل (Swagger: POST /api/auth/email/change)
  changeEmail: async (newEmail) => {
    return await axiosInstance.post(`${AUTH_BASE}/email/change`, { newEmail });
  }
};

export default authService;