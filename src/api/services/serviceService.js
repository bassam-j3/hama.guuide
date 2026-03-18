import axiosInstance from '../axiosConfig';

const API_BASE = '/Services';

/**
 * جلب كافة الخدمات.
 * ⚠️ ملاحظة للباك-إند: هذا المسار محدد كـ Deprecated في الـ Swagger، 
 * ولكن لا يوجد مسار بديل (مثال: مسار يدعم Pagination). يرجى توفير البديل.
 */
export const fetchAllServices = async () => {
    // إضافة طابع زمني لمنع الكاش غير المرغوب فيه
    const response = await axiosInstance.get(API_BASE, { params: { _t: new Date().getTime() } });
    return response.data;
};

// 🚀 Senior Fix: إرجاع الاسم الأصلي ليطابق استيرادات الـ UI
export const fetchServiceById = async (id) => {
    const response = await axiosInstance.get(`${API_BASE}/${id}`);
    return response.data;
};

export const createService = async (serviceData) => {
    // 🚀 مطابقة دقيقة لـ AddServiceRequest في الـ Swagger
    const payload = {
        title: serviceData.title,
        slug: serviceData.slug,
        description: serviceData.description || null,
        sectionId: serviceData.sectionId, 
        imageUrl: serviceData.imageUrl || null,
        schema: serviceData.schema || [] // المصفوفة اختيارية
    };
    const response = await axiosInstance.post(API_BASE, payload);
    return response.data;
};

export const updateService = async (id, serviceData) => {
    // 🚀 مطابقة دقيقة لـ UpdateServiceRequest في الـ Swagger
    const payload = {
        title: serviceData.title,
        slug: serviceData.slug,
        description: serviceData.description || null,
        imageUrl: serviceData.imageUrl || null
    };
    const response = await axiosInstance.put(`${API_BASE}/${id}`, payload);
    return response.data;
};

export const deleteService = async (id) => {
    const response = await axiosInstance.delete(`${API_BASE}/${id}`);
    return response.data;
};

const serviceService = {
    fetchAllServices,
    fetchServiceById, // تم التحديث هنا أيضاً
    createService,
    updateService,
    deleteService
};

export default serviceService;