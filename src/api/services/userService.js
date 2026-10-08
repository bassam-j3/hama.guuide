import axiosInstance from '../axiosConfig';

const API_BASE = '/Users';

const formatUserPayload = (userData) => {
    let phoneNumber = userData.phoneNumber;
    if (!phoneNumber || (typeof phoneNumber === 'string' && phoneNumber.trim() === '')) {
        phoneNumber = null;
    } else if (typeof phoneNumber === 'string') {
        phoneNumber = phoneNumber.replace(/[\s+]/g, '');
    }

    const roles = Array.isArray(userData.roles) && userData.roles.length > 0 
        ? userData.roles[0] 
        : (userData.roles || 'Admin');

    return {
        userName: userData.userName,
        email: userData.email,
        phoneNumber,
        roles
    };
};

export const userService = {
    getAllUsers: async (currentPage = 1, pageSize = 10, sortBy = "userName", sortAsc = true) => {
        const params = { currentPage, pageSize, sortBy, sortAsc };
        const response = await axiosInstance.get(API_BASE, { params });
        return response.data; // 🚀 فك الغلاف
    },

    getUserById: async (id) => {
        const response = await axiosInstance.get(`${API_BASE}/${id}`);
        return response.data;
    },

    createUser: async (userData) => {
        const payload = {
            ...formatUserPayload(userData),
            password: userData.password
        };
        const response = await axiosInstance.post(API_BASE, payload);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const payload = formatUserPayload(userData);
        const response = await axiosInstance.put(`${API_BASE}/${id}`, payload);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await axiosInstance.delete(`${API_BASE}/${id}`);
        return response.data;
    }
};