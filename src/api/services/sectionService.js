import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

export const fetchSectionsByParent = async (parentId = null, level = null) => {
    try {
        const params = {};
        if (parentId) params.parentId = parentId;
        if (level !== null && level !== undefined) params.level = level;

        const response = await axiosInstance.get(API_BASE, { params });
        return Array.isArray(response.data) ? response.data : (response.data?.items || []);
    } catch (error) {
        if (error.response?.status === 404) return [];
        throw error;
    }
};

export const fetchAllSections = async () => {
    try {
        const roots = await fetchSectionsByParent(null);
        if (!roots || roots.length === 0) return [];

        const allSections = [...roots];

        const childPromises = roots.map(root => 
            axiosInstance.get(API_BASE, { params: { parentId: root.id } })
                .then(res => Array.isArray(res.data) ? res.data : (res.data?.items || []))
                .catch(err => {
                    if (err.response?.status === 404) return [];
                    console.warn(`Could not fetch children for ${root.id}`);
                    return [];
                })
        );

        const childrenArrays = await Promise.all(childPromises);
        childrenArrays.forEach(children => allSections.push(...children));

        return allSections;
    } catch (error) {
        console.error("Error fetching sections tree:", error);
        return [];
    }
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

// 🚀 تم إرجاع الاسم إلى deleteSection لكي لا ينكسر الاستيراد في useSections.js
export const deleteSection = async (id) => {
    try {
        // 1. فك ارتباط الخدمات
        const services = await getSectionServices(id);
        if (services && services.length > 0) {
            const unlinkPromises = services.map(srv => removeServiceFromSection(srv.id));
            await Promise.allSettled(unlinkPromises);
        }

        // 2. الحذف المتسلسل للأبناء
        const children = await fetchSectionsByParent(id);
        if (children && children.length > 0) {
            const deleteChildrenPromises = children.map(child => deleteSection(child.id));
            await Promise.allSettled(deleteChildrenPromises);
        }

        // 3. حذف القسم
        const response = await axiosInstance.delete(`${API_BASE}/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
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
    try {
        const response = await axiosInstance.get(`${API_BASE}/${id}/services`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) return [];
        throw error;
    }
};

export const linkServiceToSection = async (sectionId, serviceId) => {
    const response = await axiosInstance.put(`${API_BASE}/${sectionId}/services/${serviceId}`);
    return response.data;
};

export const removeServiceFromSection = async (serviceId) => {
    const response = await axiosInstance.delete(`${API_BASE}/services/${serviceId}`);
    return response.data;
};

const sectionService = { 
    fetchSectionsByParent, fetchAllSections, getSectionById, createSection, updateSection, deleteSection, 
    assignChildSection, removeChildSection, getSectionServices, linkServiceToSection, removeServiceFromSection
};
export default sectionService;