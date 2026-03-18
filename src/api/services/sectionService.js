import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections';

export const fetchAllSections = async () => {
    // Uses /all to get flat list safely without triggering 400 Bad Request
    const response = await axiosInstance.get(`${API_BASE}/all`);
    const rawData = Array.isArray(response.data) ? response.data : (response.data?.items || []);

    const cleanSections = rawData.filter(item => {
        const isService = item.hasOwnProperty('sectionId') || item.discriminator === 'Service';
        return !isService;
    });

    return cleanSections;
};

export const fetchSectionsByParent = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null && level !== undefined) params.level = level;

    const response = await axiosInstance.get(API_BASE, { params });
    const rawData = Array.isArray(response.data) ? response.data : (response.data?.items || []);

    const cleanSections = rawData.filter(item => {
        const isService = item.hasOwnProperty('sectionId') || item.discriminator === 'Service';
        return !isService;
    });

    return cleanSections;
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

export const assignChildSection = async (parentId, childId) => {
    if (!parentId || !childId) throw new Error("Missing IDs");
    const response = await axiosInstance.put(`${API_BASE}/${parentId}/sections/${childId}`);
    return response.data;
};

export const removeChildSection = async (parentId, childId) => {
    if (!parentId || !childId) throw new Error("Missing IDs");
    const response = await axiosInstance.delete(`${API_BASE}/${parentId}/sections/${childId}`);
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
    const response = await axiosInstance.delete(`/Services/${serviceId}`);
    return response.data;
};

const sectionService = {
    fetchSectionsByParent, fetchAllSections, getSectionById, createSection, updateSection, deleteSection,
    assignChildSection, removeChildSection, getSectionServices, linkServiceToSection, removeServiceFromSection
};

export default sectionService;