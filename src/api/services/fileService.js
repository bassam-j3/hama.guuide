import axiosInstance from '../axiosConfig';

const FILE_ENDPOINT = '/upload'; 

export const uploadFile = async (fileObject) => {
    if (!fileObject) throw new Error("يرجى اختيار ملف أولاً");

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileObject.size > MAX_SIZE) throw new Error("حجم الملف كبير جداً؛ الحد الأقصى هو 10 ميجابايت");

    const formData = new FormData();
    formData.append("file", fileObject); 

    const response = await axiosInstance.post(FILE_ENDPOINT, formData);
    const data = response.data || response;
    // 🚀 استخراج الرابط حسب الـ Swagger
    return data.fileUrl || data; 
};