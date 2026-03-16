import axiosInstance from '../axiosConfig';

const AUTH_BASE = '/auth';
export const STORAGE_KEY_PREFIX = "oidc.user:hama.guide:admin"; // قمنا بتصدير هذا المفتاح ليستخدمه Axios

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

  // 🚀 جلب بيانات الملف الشخصي 
  getMe: async () => {
    return await axiosInstance.get(`${AUTH_BASE}/me`);
  },

  // 🚀 طلب إعادة تعيين الباسورد 
  requestPasswordReset: async (email) => {
    return await axiosInstance.post(`${AUTH_BASE}/request-password-reset`, null, { params: { email } });
  },

  // 🚀 تغيير الإيميل 
  changeEmail: async (newEmail) => {
    return await axiosInstance.post(`${AUTH_BASE}/email/change`, { newEmail });
  },

  // 🚀 تأكيد البريد الإلكتروني
  confirmEmailPost: async (email) => {
    return await axiosInstance.post(`${AUTH_BASE}/email/confirm`, null, { params: { email } });
  },

  // 🚀 تنفيذ تغيير كلمة المرور (مع الـ Query Parameters بناء على الـ Swagger)
  resetPassword: async (email, resetCode, newPassword) => {
    const response = await axiosInstance.post(
        `/auth/password-reset?Email=${encodeURIComponent(email)}&ResetCode=${encodeURIComponent(resetCode)}&NewPassword=${encodeURIComponent(newPassword)}`
    );
    return response.data;
  }
};

export default authService;