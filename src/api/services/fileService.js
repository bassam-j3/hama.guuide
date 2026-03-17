import axiosInstance from '../axiosConfig';

const FILE_ENDPOINT = '/upload'; 

export const uploadFile = async (fileObject) => {
    if (!fileObject) throw new Error("يرجى اختيار ملف أولاً");

    const formData = new FormData();
    formData.append("file", fileObject); 

    try {
        // 🚀 Senior Fix: إجبار Axios على استخدام multipart وتجاوز إعدادات الـ JSON
        const response = await axiosInstance.post(FILE_ENDPOINT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data?.fileUrl || response.data || response; 
    } catch (error) {
        throw error;
    }
};