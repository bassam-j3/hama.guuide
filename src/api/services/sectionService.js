import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

export const fetchSectionsByParent = async (parentId = null, level = null) => {
    try {
        const params = {};
        if (parentId) params.parentId = parentId;
        if (level !== null && level !== undefined) params.level = level;

        const response = await axiosInstance.get(API_BASE, { params });
        const rawData = Array.isArray(response.data) ? response.data : (response.data?.items || []);

        // 🚀 Senior Frontend Shield: طرد الخدمات من الأقسام
        const cleanSections = rawData.filter(item => {
            const isService = item.hasOwnProperty('sectionId') || item.discriminator === 'Service';
            return !isService; 
        });

        return cleanSections;
    } catch (error) {
        // اصطياد الـ 404 بأمان (ستظهر في الكونسول ولكن لن تكسر التطبيق)
        if (error.response?.status === 404) return [];
        throw error;
    }
};

// 🚀 Senior Fix: إرجاع الجلب اللانهائي لضمان ظهور الأقسام الفرعية (Children of Sections)
export const fetchAllSections = async () => {
    let allSections = [];
    
    const fetchRecursive = async (parentId) => {
        try {
            // الدالة هنا ستستدعي fetchSectionsByParent التي تحتوي أصلاً على الدرع الواقي
            const children = await fetchSectionsByParent(parentId);
            if (!children || children.length === 0) return;
            
            allSections.push(...children);
            
            // جلب أبناء الأبناء
            const promises = children.map(child => fetchRecursive(child.id));
            await Promise.allSettled(promises);
        } catch (err) {
            console.error("Recursion error for parent:", parentId);
        }
    };

    // البدء من الجذور (parentId = null)
    await fetchRecursive(null);
    return allSections;
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