import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

// جلب أقسام مستوى محدد بأمان شديد
export const fetchSectionsByParent = async (parentId = null, level = null) => {
    try {
        const params = {};
        if (parentId) params.parentId = parentId;
        if (level !== null && level !== undefined) params.level = level;

        const response = await axiosInstance.get(API_BASE, { params });
        return Array.isArray(response.data) ? response.data : (response.data?.items || []);
    } catch (error) {
        // اصطياد الـ 404 بصمت تام لإيقاف رسائل الكونسول المزعجة
        if (error.response?.status === 404) return [];
        throw error;
    }
};

// الدالة الذكية والمحدودة (تمنع الاستدعاء اللانهائي N+1)
export const fetchAllSections = async () => {
    try {
        // 1. جلب الجذور
        const roots = await fetchSectionsByParent(null);
        if (!roots || roots.length === 0) return [];

        const allSections = [...roots];

        // 2. جلب أبناء المستوى الأول فقط بطريقة صامتة لتخفيف الضغط
        const childPromises = roots.map(root => 
            axiosInstance.get(API_BASE, { params: { parentId: root.id } })
                .then(res => Array.isArray(res.data) ? res.data : (res.data?.items || []))
                .catch(err => {
                    if (err.response?.status === 404) return []; // صمت
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

const sectionService = { 
    fetchSectionsByParent, fetchAllSections, getSectionById, createSection, updateSection, deleteSection, 
    assignChildSection, removeChildSection 
};
export default sectionService;