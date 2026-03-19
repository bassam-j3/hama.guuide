import axiosInstance from '../axiosConfig';

const API_BASE = '/Services';

export const fetchAllServices = async () => {
    try {
        const response = await axiosInstance.get(API_BASE);
        return Array.isArray(response.data) ? response.data : (response.data?.items || []);
    } catch (error) {
        throw error;
    }
};

export const fetchServiceById = async (id) => {
    const response = await axiosInstance.get(`${API_BASE}/${id}`);
    return response.data;
};

export const createService = async (serviceData) => {
    const payload = {
        title: serviceData.title,
        slug: serviceData.slug,
        description: serviceData.description || null,
        imageUrl: serviceData.imageUrl || null,
        sectionId: serviceData.sectionId || undefined, // 👈 يتم إرسال الـ UUID للقسم المختار
        schema: serviceData.schema || null
    };
    const response = await axiosInstance.post(API_BASE, payload);
    return response.data;
};

export const updateService = async (id, serviceData) => {
    // According to Swagger: UpdateServiceRequest does NOT include sectionId or schema
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
    fetchServiceById,
    createService,
    updateService,
    deleteService
};

export default serviceService;