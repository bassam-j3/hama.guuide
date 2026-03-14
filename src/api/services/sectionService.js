import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

export const getSections = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null) params.level = level;
    return await axiosInstance.get(API_BASE, { params });
};

// 🚀 ملاحظة: نستخدم المسار الأساسي، وإذا واجهت خطأ 404 مجدداً قم بتغييره إلى `${API_BASE}/all` مؤقتاً
// 🚀 إضافة /all لكي نحصل على كافة الأقسام الرئيسية والفرعية معاً
// 🚀 إضافة Timestamp لمنع الـ Caching وجلب بيانات طازجة دائماً
export const fetchAllSections = async () => {
    return await axiosInstance.get(`${API_BASE}/all`, { params: { _t: new Date().getTime() } });
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
        imageUrl: sectionData.imageUrl || null
    };

    return await axiosInstance.post(API_BASE, payload);
};

// 🚀 هذه هي الدالة الصحيحة للأقسام (تم إزالة parentId منها)
export const updateSection = async (id, sectionData) => {
    const payload = {
        title: sectionData.title,
        slug: sectionData.slug,
        description: sectionData.description || null,
        imageUrl: sectionData.imageUrl || null
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
    // 🚀 تم تحديث المسار وطريقة الطلب (DELETE) لتتطابق مع السواجر الجديد تماماً
    return await axiosInstance.delete(`${API_BASE}/services/${serviceId}`);
};

// ==========================================
// 🚀 مسارات جديدة تمت إضافتها في السواجر لربط وفك الأقسام الفرعية بالرئيسية
// ==========================================
export const assignChildSection = async (parentId, childId) => {
    return await axiosInstance.put(`${API_BASE}/${parentId}/sections/${childId}`);
};

export const removeChildSection = async (parentId, childId) => {
    return await axiosInstance.delete(`${API_BASE}/${parentId}/sections/${childId}`);
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
    removeServiceFromSection,
    assignChildSection,
    removeChildSection
};

export default sectionService;