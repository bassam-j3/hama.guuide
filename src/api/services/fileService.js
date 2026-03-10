import axiosInstance from '../axiosConfig';

// 🚀 المسار الجديد للرفع
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
        const response = await axiosInstance.post(FILE_ENDPOINT, formData);
        
        // 🚀 الـ Interceptor الخاص بك يرجع البيانات مباشرة، لذا نسحب الرابط من fileUrl
        // إذا كان response يحتوي على fileUrl نرجعه، وإلا نرجع response كاملة (كحماية إضافية)
        return response.fileUrl ? response.fileUrl : response; 
    } catch (error) {
        throw error;
    }
};

// ⚠️ مسار الحذف غير موجود في الـ Swagger الجديد، قد نحتاج لتعطيل هذه الدالة مؤقتاً 
// أو سؤال الباك-إند إذا كان S3 سيحذف الصور تلقائياً عند حذف القسم/الخدمة.
export const deleteFile = async (identifier) => {
    console.warn("وظيفة حذف الملفات غير مدعومة حالياً من السيرفر (S3)");
    return true; 
};

const fileService = {
    uploadFile,
    deleteFile
};

export default fileService;