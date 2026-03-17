import axiosInstance from '../axiosConfig';

const SCHEMA_BASE = '/Schemas';

export const schemaService = {
  getSchemaByService: async (serviceId) => {
    const response = await axiosInstance.get(`${SCHEMA_BASE}/${serviceId}`);
    const data = response.data || response;
    // 🚀 Swagger says it returns { serviceId, schema: [] }
    return data?.schema || data || [];
  },

  getAllSchemas: async () => {
    const response = await axiosInstance.get(SCHEMA_BASE);
    const data = response.data || response;
    // 🚀 Swagger says it returns { schemas: [] }
    return data?.schemas || data || []; 
  },

  saveSchema: async (serviceId, fields) => {
    const payload = {
      serviceId: serviceId,
      types: fields.map(field => ({
        fieldName: field.fieldName,
        isRequired: field.isRequired || false,
        fieldType: field.fieldType, 
        presentation: field.presentation || "", 
        allowedTypes: field.allowedTypes || null 
      }))
    };
    const response = await axiosInstance.post(SCHEMA_BASE, payload);
    return response.data;
  }
};

export default schemaService;