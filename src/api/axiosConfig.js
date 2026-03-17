import axiosInstance from '../axiosConfig';

const AUTH_BASE = '/auth';
export const STORAGE_KEY_PREFIX = "oidc.user:hama.guide:admin"; 

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
    const data = response.data || response; // 🚀 فك الغلاف
    const authData = {
      access_token: data?.token,
      refresh_token: data?.refreshToken,
      profile: data?.user,
      token_type: "Bearer"
    };
    sessionStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(authData));
    return authData;
  },

  logout: () => {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX);
  },

  register: async (userData) => {
    const response = await axiosInstance.post(`${AUTH_BASE}/register`, userData);
    return response.data;
  },

  refresh: async (token) => {
    const response = await axiosInstance.post(`${AUTH_BASE}/refresh`, null, { params: { refreshToken: token } });
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get(`${AUTH_BASE}/me`);
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await axiosInstance.post(`${AUTH_BASE}/request-password-reset`, null, { params: { email } });
    return response.data;
  },

  changeEmail: async (newEmail) => {
    const response = await axiosInstance.post(`${AUTH_BASE}/email/change`, { newEmail });
    return response.data;
  }
};