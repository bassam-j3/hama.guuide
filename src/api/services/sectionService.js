import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

export const fetchAllSections = async () => {
    try {
        // 🚀 Senior Fix: استدعاء واحد فقط يجلب كل شيء! لا مزيد من استدعاءات الأبناء المزعجة ولا مزيد من الـ 404!
        const response = await axiosInstance.get(API_BASE);
        const rawData = Array.isArray(response.data) ? response.data : (response.data?.items || []);

        // 🚀 الدرع الواقي: طرد الخدمات من الأقسام
        const cleanSections = rawData.filter(item => {
            const isService = item.hasOwnProperty('sectionId') || item.discriminator === 'Service';
            return !isService; 
        });

        return cleanSections;
    } catch (error) {
        console.error("Error fetching sections:", error);
        return [];
    }
};

export const fetchSectionsByParent = async (parentId = null, level = null) => {
    try {
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
    } catch (error) {
        if (error.response?.status === 404) return [];
        throw error;
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

export const deleteSection = async (id) => {
    try {
        const services = await getSectionServices(id);
        if (services && services.length > 0) {
            const deleteServicesPromises = services.map(srv => 
                axiosInstance.delete(`/Services/${srv.id}`).catch(err => {
                    if (err.response?.status !== 404) throw err;
                })
            );
            await Promise.allSettled(deleteServicesPromises);
        }

        const children = await fetchSectionsByParent(id);
        if (children && children.length > 0) {
            const deleteChildrenPromises = children.map(child => deleteSection(child.id));
            await Promise.allSettled(deleteChildrenPromises);
        }

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