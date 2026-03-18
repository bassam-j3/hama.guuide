import { axiosUploadInstance } from '../axiosConfig';

const FILE_ENDPOINT = '/upload'; 

export const uploadFile = async (fileObject) => {
    if (!fileObject) throw new Error("يرجى اختيار ملف أولاً");

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileObject.size > MAX_SIZE) {
        throw new Error("حجم الملف كبير جداً؛ الحد الأقصى هو 10 ميجابايت");
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(fileObject.type)) {
        throw new Error("صيغة الملف غير مدعومة. يسمح بـ (JPG, PNG, WebP, PDF)");
    }

    const formData = new FormData();
    formData.append("file", fileObject); 

    try {
        // 🚀 استخدام النسخة المخصصة للرفع والتي تتكفل بالـ Auth والـ Refresh Token تلقائياً
        const response = await axiosUploadInstance.post(FILE_ENDPOINT, formData);
        
        return response.data?.fileUrl || response.data || response; 
    } catch (error) {
        throw error;
    }
};