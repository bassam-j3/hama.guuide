import axiosInstance from '../axiosConfig';

const API_BASE = '/Sections'; 

/**
 * 1. جلب الأقسام مع الفلترة (اختياري)
 * Swagger: GET /api/Sections
 */
export const getSections = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null) params.level = level;

    // ملاحظة: نستخدم axiosInstance الذي يقوم بفك التغليف (Unwrapping) تلقائياً
    return await axiosInstance.get(API_BASE, { params });
};

/**
 * 2. جلب كل الأقسام (المسار المختصر)
 * Swagger: GET /api/Sections/all
 */
export const fetchAllSections = async () => {
    return await axiosInstance.get(`${API_BASE}/all`);
};

/**
 * 3. جلب تفاصيل قسم محدد بواسطة المعرف
 * Swagger: GET /api/Sections/{id}
 */
export const getSectionById = async (id) => {
    return await axiosInstance.get(`${API_BASE}/${id}`);
};

/**
 * 4. إنشاء قسم جديد
 * Swagger: POST /api/Sections
 */
export const createSection = async (sectionData) => {
    const payload = {
        title: sectionData.title,
        slug: sectionData.slug,
        description: sectionData.description || null,
        // إرسال null صريح إذا لم يوجد أب، لأن Guid لا يقبل نص فارغ ""
        parentId: (sectionData.parentId && sectionData.parentId.trim() !== "") 
                  ? sectionData.parentId 
                  : null,
        // تنظيف الرابط لإرسال المسار النسبي فقط للسيرفر
        imageUrl: sectionData.imageUrl ? sectionData.imageUrl.replace(/^(?:\/\/|[^\/]+)*\//, '/') : null
    };

    return await axiosInstance.post(API_BASE, payload);
};

/**
 * 5. تحديث بيانات قسم
 * Swagger: PUT /api/Sections/{id}
 */
/**
 * 5. تحديث بيانات قسم
 * Swagger: PUT /api/Sections/{id}
 */
export const updateSection = async (id, sectionData) => {
    const payload = {
        title: sectionData.title,
        slug: sectionData.slug,
        description: sectionData.description || null,
        imageUrl: sectionData.imageUrl || null,
        // ✅ إضافة هذا السطر: إرسال الأب (أو null) للسيرفر
        parentId: (sectionData.parentId && sectionData.parentId !== "") 
                  ? sectionData.parentId 
                  : null
    };
    return await axiosInstance.put(`${API_BASE}/${id}`, payload);
};

/**
 * 6. حذف قسم
 * Swagger: DELETE /api/Sections/{id}
 */
export const deleteSection = async (id) => {
    return await axiosInstance.delete(`${API_BASE}/${id}`);
};

/**
 * 7. جلب الخدمات المرتبطة بقسم معين
 * Swagger: GET /api/Sections/{id}/services
 */
export const getSectionServices = async (id) => {
    return await axiosInstance.get(`${API_BASE}/${id}/services`);
};

/**
 * 8. ربط خدمة بقسم (إضافة خدمة للقسم)
 * Swagger: PUT /api/Sections/{id}/services/{serviceId}
 */
export const linkServiceToSection = async (sectionId, serviceId) => {
    return await axiosInstance.put(`${API_BASE}/${sectionId}/services/${serviceId}`);
};

/**
 * 9. إزالة خدمة من أي قسم (فك الارتباط)
 * Swagger: POST /api/Sections/services/remove/{serviceId}
 */
export const removeServiceFromSection = async (serviceId) => {
    return await axiosInstance.post(`${API_BASE}/services/remove/${serviceId}`);
};

// تصدير الكائن الموحد لضمان التوافق مع صفحاتك
const sectionService = {
    getSections,
    fetchAllSections,
    getSectionById,
    createSection,
    updateSection,
    deleteSection,
    getSectionServices,
    linkServiceToSection,
    removeServiceFromSection
};

export default sectionService;