import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

// 🚀 Senior Fix: استبدال GET /Sections/all (Deprecated) بالمسار القياسي مع البارامترات
export const fetchAllSections = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null && level !== undefined) params.level = level;
    
    // إضافة طابع زمني لمنع الكاش العنيف إن لزم الأمر
    params._t = new Date().getTime();

    const response = await axiosInstance.get(API_BASE, { params });
    return response.data;
};

export const getSectionById = async (id) => {
    const response = await axiosInstance.get(`${API_BASE}/${id}`);
    return response.data;
};

export const createSection = async (sectionData) => {
    const payload = {
        title: sectionData.title,
        slug: sectionData.slug,
        description: sectionData.description || null,
        parentId: (sectionData.parentId && sectionData.parentId.trim() !== "") ? sectionData.parentId : null,
        imageUrl: sectionData.imageUrl || null
    };
    const response = await axiosInstance.post(API_BASE, payload);
    return response.data;
};

export const updateSection = async (id, sectionData) => {
    const payload = {
        title: sectionData.title,
        slug: sectionData.slug,
        description: sectionData.description || null,
        imageUrl: sectionData.imageUrl || null
    };
    const response = await axiosInstance.put(`${API_BASE}/${id}`, payload);
    return response.data;
};

export const deleteSection = async (id) => {
    const response = await axiosInstance.delete(`${API_BASE}/${id}`);
    return response.data;
};

export const getSectionServices = async (id) => {
    const response = await axiosInstance.get(`${API_BASE}/${id}/services`);
    return response.data;
};

export const linkServiceToSection = async (sectionId, serviceId) => {
    const response = await axiosInstance.put(`${API_BASE}/${sectionId}/services/${serviceId}`);
    return response.data;
};

export const removeServiceFromSection = async (serviceId) => {
    const response = await axiosInstance.delete(`${API_BASE}/services/${serviceId}`);
    return response.data;
};

export const assignChildSection = async (parentId, childId) => {
    const response = await axiosInstance.put(`${API_BASE}/${parentId}/sections/${childId}`);
    return response.data;
};

export const removeChildSection = async (parentId, childId) => {
    const response = await axiosInstance.delete(`${API_BASE}/${parentId}/sections/${childId}`);
    return response.data;
};

const sectionService = { 
    fetchAllSections, getSectionById, createSection, updateSection, deleteSection, 
    getSectionServices, linkServiceToSection, removeServiceFromSection, 
    assignChildSection, removeChildSection 
};

export default sectionService;