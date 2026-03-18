import axiosInstance from '../axiosConfig';

const BASE_PATH = '/Sections';

/**
 * Fetch sections with optional pagination/hierarchy parameters.
 * 🚀 SENIOR FIX: Replaced deprecated /Sections/all with standard /Sections?parentId=&level=
 */
export const fetchAllSections = async (parentId = null, level = null) => {
    const params = {};
    if (parentId) params.parentId = parentId;
    if (level !== null && level !== undefined) params.level = level;

    const response = await axiosInstance.get(BASE_PATH, { params });
    return response.data;
};

export const getSectionById = async (id) => {
    const response = await axiosInstance.get(`${BASE_PATH}/${id}`);
    return response.data;
};

export const createSection = async (data) => {
    const response = await axiosInstance.post(BASE_PATH, data);
    return response.data;
};

export const updateSection = async (id, data) => {
    const response = await axiosInstance.put(`${BASE_PATH}/${id}`, data);
    return response.data;
};

export const deleteSection = async (id) => {
    const response = await axiosInstance.delete(`${BASE_PATH}/${id}`);
    return response.data;
};