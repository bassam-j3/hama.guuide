import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

// 1. الدالة الأساسية التي تطابق الـ Swagger وتجلب مستوى واحد فقط
export const fetchSectionsByParent = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null && level !== undefined) params.level = level;
    params._t = new Date().getTime();

    const response = await axiosInstance.get(API_BASE, { params });
    // التعامل الآمن مع الاستجابة لضمان إرجاع مصفوفة
    return Array.isArray(response.data) ? response.data : (response.data?.items || []);
};

// 2. 🚀 Senior Fix: الدالة المتكررة (Recursive) كبديل لـ /all المهجورة
// هذه الدالة ستقوم بتجميع كافة الأقسام من كافة المستويات وإرجاعها في مصفوفة واحدة
export const fetchAllSections = async () => {
    const allSections = [];
    
    const fetchRecursive = async (currentParentId = null) => {
        // جلب الأبناء للأب الحالي
        const sections = await fetchSectionsByParent(currentParentId);
        
        if (!sections || sections.length === 0) return;
        
        // إضافة الأقسام المكتشفة إلى المصفوفة الرئيسية
        allSections.push(...sections);
        
        // جلب أبناء هؤلاء الأقسام بشكل متوازٍ (Parallel) لتسريع العملية
        const promises = sections.map(sec => fetchRecursive(sec.id));
        await Promise.all(promises);
    };

    // البدء بجلب الجذور (التي ليس لها أب)
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
    fetchSectionsByParent, fetchAllSections, getSectionById, createSection, updateSection, deleteSection, 
    getSectionServices, linkServiceToSection, removeServiceFromSection, 
    assignChildSection, removeChildSection 
};

export default sectionService;