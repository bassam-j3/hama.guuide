import axiosInstance from '../axiosConfig';

const API_BASE = '/AuditLogs';

export const fetchAuditLogs = async () => {
    const response = await axiosInstance.get(API_BASE);
    return Array.isArray(response.data) ? response.data : (response.data?.items || []);
};
