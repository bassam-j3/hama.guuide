import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

export const getSections = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null) params.level = level;
    return await axiosInstance.get(API_BASE, { params });
};

// 🚀 تم الاستغناء عن /all لأنه أصبح Deprecated في Swagger
export const fetchAllSections = async () => {
    return await axiosInstance.get(API_BASE);
};

export const getSectionById = async (id) => {
    return await axiosInstance.get(`${API_BASE}/${id}`);
};

export const createSection = async (sectionData) => {
    const payload = {
        title: sectionData.title,
        slug: sectionData.slug,
        description: sectionData.description || null,
        parentId: (sectionData.parentId && sectionData.parentId.trim() !== "") 
                  ? sectionData.parentId 
                  : null,
        // 🚀 تم حذف الـ Regex الخطير لكي نحتفظ برابط S3 كاملاً
        imageUrl: sectionData.imageUrl || null
    };

    return await axiosInstance.post(API_BASE, payload);
};

export const updateSection = async (id, sectionData) => {
    const payload = {
        title: sectionData.title,
        slug: sectionData.slug,
        description: sectionData.description || null,
        imageUrl: sectionData.imageUrl || null, // 🚀 رابط S3 يرسل كاملاً
        parentId: (sectionData.parentId && sectionData.parentId !== "") 
                  ? sectionData.parentId 
                  : null
    };
    return await axiosInstance.put(`${API_BASE}/${id}`, payload);
};

export const deleteSection = async (id) => {
    return await axiosInstance.delete(`${API_BASE}/${id}`);
};

export const getSectionServices = async (id) => {
    return await axiosInstance.get(`${API_BASE}/${id}/services`);
};

export const linkServiceToSection = async (sectionId, serviceId) => {
    return await axiosInstance.put(`${API_BASE}/${sectionId}/services/${serviceId}`);
};

export const removeServiceFromSection = async (serviceId) => {
    return await axiosInstance.post(`${API_BASE}/services/remove/${serviceId}`);
};

const sectionService = {
    getSections,
    fetchAllSections,
    getSectionById,
    createSection,
    updateSection,
    deleteSection,
    getSectionServices,
    linkServiceToSection,
    removeServiceFromSection
};

export default sectionService;