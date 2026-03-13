import axiosInstance from '../axiosConfig';

const API_SERVICES = '/Services';
const API_SCHEMAS = '/Schemas';
const API_SECTIONS = '/Sections';

export const fetchAllServices = async () => {
    return await axiosInstance.get(API_SERVICES);
};

export const fetchServiceById = async (id) => {
    return await axiosInstance.get(`${API_SERVICES}/${id}`);
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
    
    return await axiosInstance.post(API_SERVICES, payload);
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

    // 🚀 الإصلاح الجوهري هنا (تمت إضافته بشكل صحيح)
    if (serviceData.sectionId) {
        try {
            await axiosInstance.put(`${API_SECTIONS}/${serviceData.sectionId}/services/${id}`);
        } catch (e) {
            console.warn("Failed to update section link", e);
        }
    } else if (serviceData.sectionId === null) {
        // فك الارتباط
        try {
            await axiosInstance.delete(`${API_SECTIONS}/services/${id}`);
        } catch (e) {
            console.warn("Failed to unlink service from section", e);
        }
    }

    return true;
};

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