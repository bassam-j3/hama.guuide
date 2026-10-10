import axiosInstance from '../axiosConfig';

const API_BASE = '/Users';

export const ROLE_MAP = {
    1: 'Admin',
    2: 'ServiceAdmin',
    3: 'SuperAdmin',
    4: 'User',
    0: 'Admin'
};

export const ROLE_INT_MAP = ROLE_MAP;

export const normalizeRoleToString = (val) => {
    if (val === undefined || val === null) return 'Admin';
    if (Array.isArray(val)) {
        return val.length > 0 ? normalizeRoleToString(val[0]) : 'Admin';
    }
    if (typeof val === 'number') {
        return ROLE_MAP[val] || 'Admin';
    }
    if (typeof val === 'string') {
        const num = Number(val);
        if (!isNaN(num) && val.trim() !== '' && ROLE_MAP[num]) {
            return ROLE_MAP[num];
        }
        return val;
    }
    return 'Admin';
};

const formatUserPayload = (userData) => {
    let phoneNumber = userData.phoneNumber;
    if (!phoneNumber || (typeof phoneNumber === 'string' && phoneNumber.trim() === '')) {
        phoneNumber = null;
    } else if (typeof phoneNumber === 'string') {
        phoneNumber = phoneNumber.replace(/[\s+]/g, '');
    }

    let roles = 'Admin';
    if (userData.roles !== undefined && userData.roles !== null) {
        roles = normalizeRoleToString(userData.roles);
    } else if (userData.role !== undefined && userData.role !== null) {
        roles = normalizeRoleToString(userData.role);
    }

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
        const data = response.data;
        const items = Array.isArray(data) 
            ? data 
            : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.Items) ? data.Items : []));
        const totalCount = data?.totalCount ?? data?.TotalCount ?? items.length;
        const totalPages = data?.totalPages ?? data?.TotalPages ?? Math.max(1, Math.ceil(totalCount / pageSize));

        return { items, totalCount, totalPages, page: currentPage, pageSize };
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

    updateUser: async (id, userData, config = {}) => {
        const payload = formatUserPayload(userData);
        // Strictly uses configured axiosInstance ensuring request interceptor attaches Authorization header
        const response = Object.keys(config).length > 0
            ? await axiosInstance.put(`${API_BASE}/${id}`, payload, config)
            : await axiosInstance.put(`${API_BASE}/${id}`, payload);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await axiosInstance.delete(`${API_BASE}/${id}`);
        return response.data;
    }
};

export default userService;
