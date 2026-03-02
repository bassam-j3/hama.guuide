import axiosInstance from '../axiosConfig';

const API_SERVICES = '/Services';
const API_SCHEMAS = '/Schemas';
const API_SECTIONS = '/Sections';

/**
 * 1. جلب كل الخدمات
 * Swagger: GET /api/Services
 */
export const fetchAllServices = async () => {
    return await axiosInstance.get(API_SERVICES);
};

/**
 * 2. جلب خدمة بالـ ID
 * Swagger: GET /api/Services/{id}
 */
export const fetchServiceById = async (id) => {
    return await axiosInstance.get(`${API_SERVICES}/${id}`);
};

/**
 * 3. إنشاء خدمة جديدة
 * Swagger: POST /api/Services
 * ملاحظة: هذا الرابط الوحيد الذي يقبل (SectionId) و (Schema) دفعة واحدة.
 */
export const createService = async (serviceData) => {
    const payload = {
        title: serviceData.title,
        slug: serviceData.slug,
        description: serviceData.description || null,
        imageUrl: serviceData.imageUrl || null,
        sectionId: serviceData.sectionId, 
        // حسب Swagger AddServiceRequest: المصفوفة اسمها schema
        schema: (serviceData.schema || []).map(field => ({
            fieldName: field.fieldName,
            isRequired: field.isRequired || false,
            fieldType: field.fieldType,
            presentation: field.presentation || "",
            allowedTypes: [] // مصفوفة فارغة حسب الـ DTO
        }))
    };
    
    return await axiosInstance.post(API_SERVICES, payload);
};

/**
 * 4. التحديث الذكي (Smart Update) 🔥
 * بما أن Swagger UpdateServiceRequest لا يقبل القسم ولا السكيما،
 * نقوم بتقسيم العملية إلى 3 طلبات متتالية.
 */
export const updateService = async (id, serviceData) => {
    
    // أ: تحديث المعلومات الأساسية
    // Swagger: PUT /api/Services/{id}
    const basicPayload = {
        title: serviceData.title,
        slug: serviceData.slug,
        description: serviceData.description || null,
        imageUrl: serviceData.imageUrl || null
    };
    
    // ننتظر نجاح هذا الطلب أولاً
    await axiosInstance.put(`${API_SERVICES}/${id}`, basicPayload);

    // ب: تحديث السكيما (إذا وجدت)
    // Swagger: POST /api/Schemas (UpdateSchemaRequest)
    if (serviceData.schema && serviceData.schema.length > 0) {
        const schemaPayload = {
            serviceId: id,
            // حسب Swagger: الحقل اسمه types
            types: serviceData.schema.map(field => ({
                fieldName: field.fieldName,
                isRequired: field.isRequired || false,
                fieldType: field.fieldType,
                presentation: field.presentation || "",
                allowedTypes: []
            }))
        };
        // نستخدم catch لكي لا تفشل العملية بالكامل إذا فشل تحديث السكيما
        await axiosInstance.post(API_SCHEMAS, schemaPayload).catch(console.warn);
    }

    // ج: تحديث رابط القسم (نقل الخدمة)
    // Swagger: PUT /api/Sections/{sectionId}/services/{serviceId}
    if (serviceData.sectionId) {
        try {
            await axiosInstance.put(`${API_SECTIONS}/${serviceData.sectionId}/services/${id}`);
        } catch (e) {
            console.warn("Failed to update section link", e);
        }
    }

    return true;
};

/**
 * 5. حذف خدمة
 * Swagger: DELETE /api/Services/{id}
 */
export const deleteService = async (id) => {
    return await axiosInstance.delete(`${API_SERVICES}/${id}`);
};

const serviceService = {
    fetchAllServices,
    fetchServiceById,
    createService,
    updateService,
    deleteService
};

export default serviceService;