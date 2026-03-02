import axiosInstance from '../axiosConfig';

const FILE_ENDPOINT = '/Files'; 

/**
 * 1. رفع ملف جديد
 * يدعم التحقق من الحجم والنوع قبل الإرسال لتوفير باندويث السيرفر.
 */
export const uploadFile = async (fileObject) => {
    if (!fileObject) throw new Error("يرجى اختيار ملف أولاً");

    // تحقق من الحجم (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileObject.size > MAX_SIZE) {
        throw new Error("حجم الملف كبير جداً؛ الحد الأقصى هو 10 ميجابايت");
    }

    // تحقق من نوع الملف (Security Check)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(fileObject.type)) {
        throw new Error("صيغة الملف غير مدعومة. يسمح بـ (JPG, PNG, WebP, PDF)");
    }

    const formData = new FormData();
    formData.append("file", fileObject); 

    try {
        // Interceptor سيقوم بمعالجة الـ Headers تلقائياً
        const response = await axiosInstance.post(FILE_ENDPOINT, formData);
        return response; 
    } catch (error) {
        throw error;
    }
};

/**
 * 2. جلب قائمة الملفات
 */
export const fetchFiles = async () => {
    try {
        const response = await axiosInstance.get(FILE_ENDPOINT);
        return response || []; 
    } catch (error) {
        console.error("فشل جلب قائمة الملفات");
        return []; 
    }
};

/**
 * 3. حذف ملف (ذكي)
 * @param {string} identifier - يمكن أن يكون ID الملف أو رابط الملف الكامل (URL)
 */
export const deleteFile = async (identifier) => {
    if (!identifier) return;

    try {
        // إذا كان المدخل رابطاً كاملاً، استخرج اسم الملف أو الـ ID من نهايته
        let fileId = identifier;
        if (identifier.includes('/')) {
            fileId = identifier.split('/').pop();
        }

        await axiosInstance.delete(`${FILE_ENDPOINT}/${fileId}`);
        return true;
    } catch (error) {
        console.error(`خطأ في حذف الملف: ${identifier}`, error);
        throw error;
    }
};

const fileService = {
    uploadFile,
    fetchFiles,
    deleteFile
};

export default fileService;