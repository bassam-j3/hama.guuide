import axiosInstance from '../axiosConfig';

// انتبه: Swagger يقول "Sections" بحرف S كبير في البداية
const API_BASE = '/Sections'; 

export const fetchSectionsByParent = async (parentId = null, level = null) => {
    try {
        const params = {};
        if (parentId) params.parentId = parentId;
        if (level !== null && level !== undefined) params.level = level;
        params._t = new Date().getTime();

        const response = await axiosInstance.get(API_BASE, { params });
        return Array.isArray(response.data) ? response.data : (response.data?.items || []);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return []; // إرجاع مصفوفة فارغة بصمت إذا لم يكن هناك أبناء
        }
        throw error;
    }
};

// 🚀 Senior Fix: إيقاف القصف العشوائي للسيرفر.
// سنجلب المستويات الرئيسية، ثم نجلب أبناءها فقط، ولن نتعمق أكثر لمنع انهيار المتصفح.
export const fetchAllSections = async () => {
    // 1. جلب الجذور (بدون أب)
    const rootSections = await fetchSectionsByParent(null);
    if (!rootSections || rootSections.length === 0) return [];

    const allSections = [...rootSections];

    // 2. جلب المستوى الأول من الأبناء فقط (مستوى واحد للأسفل) لتوفير الـ N+1 Requests
    const promises = rootSections.map(sec => fetchSectionsByParent(sec.id));
    const childrenArrays = await Promise.all(promises);

    // دمج أبناء المستوى الأول في المصفوفة الرئيسية
    childrenArrays.forEach(children => {
        if (children && children.length > 0) {
            allSections.push(...children);
        }
    });

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

// 🚀 Senior Fix: مسارات الربط بين الأقسام
export const assignChildSection = async (parentId, childId) => {
    if (!parentId || !childId) throw new Error("ParentId and ChildId are required");
    // مسار الـ Swagger الدقيق هو: /api/Sections/{parentId}/sections/{childId}
    const response = await axiosInstance.put(`${API_BASE}/${parentId}/sections/${childId}`);
    return response.data;
};

export const removeChildSection = async (parentId, childId) => {
    if (!parentId || !childId) throw new Error("ParentId and ChildId are required");
    const response = await axiosInstance.delete(`${API_BASE}/${parentId}/sections/${childId}`);
    return response.data;
};

const sectionService = { 
    fetchSectionsByParent, fetchAllSections, getSectionById, createSection, updateSection, deleteSection, 
    getSectionServices, linkServiceToSection, removeServiceFromSection, 
    assignChildSection, removeChildSection 
};

export default sectionService;