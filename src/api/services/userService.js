import axiosInstance from '../axiosConfig';

const API_BASE = '/Users';

export const userService = {
    getAllUsers: async (currentPage = 1, pageSize = 10, sortBy = "userName", sortAsc = true) => {
        const params = { CurrentPage: currentPage, PageSize: pageSize, SortBy: sortBy, SortAsc: sortAsc };
        const response = await axiosInstance.get(API_BASE, { params });
        return response.data; // 🚀 فك الغلاف
    },

    getUserById: async (id) => {
        const response = await axiosInstance.get(`${API_BASE}/${id}`);
        return response.data;
    },

    createUser: async (userData) => {
        const payload = {
            userName: userData.userName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || null,
            password: userData.password
        };
        const response = await axiosInstance.post(API_BASE, payload);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const payload = {
            userName: userData.userName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || null
        };
        const response = await axiosInstance.put(`${API_BASE}/${id}`, payload);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await axiosInstance.delete(`${API_BASE}/${id}`);
        return response.data;
    }
};