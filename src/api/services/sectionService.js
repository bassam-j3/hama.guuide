import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

export const getSections = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null) params.level = level;
    return await axiosInstance.get(API_BASE, { params });
};

// 🚀 ملاحظة: نستخدم المسار الأساسي، وإذا واجهت خطأ 404 مجدداً قم بتغييره إلى `${API_BASE}/all` مؤقتاً
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
        imageUrl: sectionData.imageUrl || null
    };

    return await axiosInstance.post(API_BASE, payload);
};

export const updateService = async (id, serviceData) => {
    const basicPayload = {
        title: serviceData.title,
        slug: serviceData.slug,
        description: serviceData.description || null,
        imageUrl: serviceData.imageUrl || null
    };
    
    await axiosInstance.put(`${API_SERVICES}/${id}`, basicPayload);

    if (serviceData.schema && serviceData.schema.length > 0) {
        const schemaPayload = {
            serviceId: id,
            types: serviceData.schema.map(field => ({
                fieldName: field.fieldName,
                isRequired: field.isRequired || false,
                fieldType: field.fieldType,
                presentation: field.presentation || "",
                allowedTypes: []
            }))
        };
        await axiosInstance.post(API_SCHEMAS, schemaPayload).catch(console.warn);
    }

    // 🚀 الإصلاح الجوهري هنا: معالجة الربط وفك الربط (Linking & Unlinking)
    if (serviceData.sectionId) {
        try {
            await axiosInstance.put(`${API_SECTIONS}/${serviceData.sectionId}/services/${id}`);
        } catch (e) {
            console.warn("Failed to update section link", e);
        }
    } else if (serviceData.sectionId === null) {
        // 🚀 إذا اختار المدير "-- بدون قسم --"، نقوم بفك الارتباط فعلياً من السيرفر
        try {
            await axiosInstance.delete(`${API_SECTIONS}/services/${id}`);
        } catch (e) {
            console.warn("Failed to unlink service from section", e);
        }
    }

    return true;
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