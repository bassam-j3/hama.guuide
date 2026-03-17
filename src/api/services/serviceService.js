import axiosInstance from '../axiosConfig';

const API_SERVICES = '/Services';
const API_SCHEMAS = '/Schemas';
const API_SECTIONS = '/Sections';

export const fetchAllServices = async () => {
    const response = await axiosInstance.get(API_SERVICES);
    return response.data; // 🚀 فك الغلاف
};

export const fetchServiceById = async (id) => {
    const response = await axiosInstance.get(`${API_SERVICES}/${id}`);
    return response.data;
};

export const createService = async (serviceData) => {
    const payload = {
        title: serviceData.title,
        slug: serviceData.slug,
        description: serviceData.description || null,
        imageUrl: serviceData.imageUrl || null,
        sectionId: serviceData.sectionId, 
        schema: (serviceData.schema || []).map(field => ({
            fieldName: field.fieldName,
            isRequired: field.isRequired || false,
            fieldType: field.fieldType,
            presentation: field.presentation || "",
            allowedTypes: []
        }))
    };
    
    const response = await axiosInstance.post(API_SERVICES, payload);
    return response.data;
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

    if (serviceData.sectionId) {
        try { await axiosInstance.put(`${API_SECTIONS}/${serviceData.sectionId}/services/${id}`); } catch (e) { console.warn(e); }
    } else if (serviceData.sectionId === null) {
        try { await axiosInstance.delete(`${API_SECTIONS}/services/${id}`); } catch (e) { console.warn(e); }
    }

    return true;
};

export const deleteService = async (id) => {
    const response = await axiosInstance.delete(`${API_SERVICES}/${id}`);
    return response.data;
};

const serviceService = { fetchAllServices, fetchServiceById, createService, updateService, deleteService };
export default serviceService;