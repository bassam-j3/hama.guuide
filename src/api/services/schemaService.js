import axiosInstance from '../axiosConfig';

/**
 * خدمة إدارة المخططات (Schemas)
 * المسار في السواجر: /api/Schemas
 */
const SCHEMA_BASE = '/Schemas';

export const schemaService = {
  
  /**
   * 1. جلب مخطط خدمة معينة بواسطة الـ ID
   * Swagger: GET /api/Schemas/{serviceId}
   */
  getSchemaByService: async (serviceId) => {
    // نعتمد على axiosInstance لفك التغليف (Unwrapping)
    // سيعيد كائن يحتوي على { serviceId, schema: [] }
    return await axiosInstance.get(`${SCHEMA_BASE}/${serviceId}`);
  },

  /**
   * 2. جلب جميع المخططات الموجودة لكل الخدمات
   * Swagger: GET /api/Schemas
   */
  getAllSchemas: async () => {
    // سيعيد مصفوفة من المخططات grouped by service
    return await axiosInstance.get(SCHEMA_BASE);
  },

  /**
   * 3. حفظ أو تحديث المخطط (Schema)
   * Swagger: POST /api/Schemas
   * @param {string} serviceId - المعرف الفريد للخدمة (UUID)
   * @param {Array} fields - مصفوفة الحقول الديناميكية
   */
  saveSchema: async (serviceId, fields) => {
    /**
     * هام جداً: بناءً على سكيما UpdateSchemaRequest في السواجر:
     * الجسم (Body) يجب أن يحتوي على "serviceId" ومصفوفة تسمى "types"
     */
    const payload = {
      serviceId: serviceId,
      types: fields.map(field => ({
        fieldName: field.fieldName,
        isRequired: field.isRequired || false,
        fieldType: field.fieldType, // "String", "Int", "Image", "Address"...
        presentation: field.presentation || "", // وسيلة العرض: "textarea", "select"...
        allowedTypes: field.allowedTypes || null // تستخدم فقط في حالة Enum
      }))
    };

    // إرسال الطلب عبر REST API
    return await axiosInstance.post(SCHEMA_BASE, payload);
  }
};

export default schemaService;