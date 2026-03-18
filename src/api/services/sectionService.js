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

// 🚀 Senior Fix: جلب لانهائي (Deep Recursion) يجلب كل المستويات
export const fetchAllSections = async () => {
    const allSections = [];
    
    const fetchRecursive = async (parentId) => {
        try {
            const children = await fetchSectionsByParent(parentId);
            if (!children || children.length === 0) return;
            
            allSections.push(...children);
            
            // جلب أبناء هؤلاء الأبناء (Recursion)
            const promises = children.map(child => fetchRecursive(child.id));
            await Promise.all(promises);
        } catch (err) {
            // تجاهل أخطاء الـ 404 بصمت تام
        }
    };

    // البدء من الجذور
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

// 🚀 Senior Fix: الحذف المتسلسل (Cascading Delete) من جهة الفرونت إند
export const deleteSectionCascade = async (id) => {
    try {
        // 1. جلب وحذف كافة الخدمات المرتبطة بهذا القسم
        const services = await getSectionServices(id);
        if (services && services.length > 0) {
            const unlinkPromises = services.map(srv => removeServiceFromSection(srv.id));
            await Promise.allSettled(unlinkPromises);
        }

        // 2. جلب وحذف كافة الأبناء (بشكل متكرر)
        const children = await fetchSectionsByParent(id);
        if (children && children.length > 0) {
            const deleteChildrenPromises = children.map(child => deleteSectionCascade(child.id));
            await Promise.allSettled(deleteChildrenPromises);
        }

        // 3. أخيراً، حذف القسم الأب نفسه
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
    fetchSectionsByParent, fetchAllSections, getSectionById, createSection, updateSection, 
    deleteSection: deleteSectionCascade, // ربط الحذف بالحذف المتسلسل
    assignChildSection, removeChildSection, getSectionServices, linkServiceToSection, removeServiceFromSection
};
export default sectionService;