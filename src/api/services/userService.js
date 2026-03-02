import axiosInstance from '../axiosConfig';

const API_BASE = '/Users';

export const userService = {
    // 1. جلب المستخدمين (مع دعم الترقيم والترتيب حسب السواجر)
    getAllUsers: async (currentPage = 1, pageSize = 10, sortBy = "userName", sortAsc = true) => {
        const params = { 
            CurrentPage: currentPage, 
            PageSize: pageSize, 
            SortBy: sortBy, 
            SortAsc: sortAsc 
        };
        // نمرر الـ params للـ GET request
        const response = await axiosInstance.get(API_BASE, { params });
        
        // إعادة الاستجابة بالكامل لكي تتمكن الصفحة من قراءة (items و totalPages)
        return response; 
    },

    // 2. جلب مستخدم محدد
    getUserById: async (id) => {
        return await axiosInstance.get(`${API_BASE}/${id}`);
    },

    // 3. إنشاء مستخدم جديد
    createUser: async (userData) => {
        const payload = {
            userName: userData.userName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || null,
            password: userData.password
        };
        return await axiosInstance.post(API_BASE, payload);
    },

    // 4. تعديل مستخدم
    updateUser: async (id, userData) => {
        const payload = {
            userName: userData.userName,
            email: userData.email,
            phoneNumber: userData.phoneNumber || null
        };
        return await axiosInstance.put(`${API_BASE}/${id}`, payload);
    },

    // 5. حذف مستخدم
    deleteUser: async (id) => {
        return await axiosInstance.delete(`${API_BASE}/${id}`);
    }
};

export default userService;