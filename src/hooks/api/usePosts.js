import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    fetchPostsByServiceSlug, 
    createPostREST, 
    updatePostREST, 
    deletePostREST,
    deletePostRating
} from '../../api/services/postService';
import toast from 'react-hot-toast';

// 🚀 1. جلب المنشورات (عبر GraphQL)
export const usePostsBySlug = (serviceSlug) => {
    return useQuery({
        queryKey: ['posts', serviceSlug], // الكاش يعتمد على اسم الخدمة
        queryFn: () => fetchPostsByServiceSlug(serviceSlug),
        enabled: !!serviceSlug, // لا تقم بالجلب إذا لم يكن هناك مسار خدمة
    });
};

// 🚀 2. إنشاء منشور جديد (عبر REST)
export const useCreatePost = (serviceSlug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (postData) => createPostREST(serviceSlug, postData),
        onSuccess: () => {
            toast.success('تم نشر البوست بنجاح!');
            queryClient.invalidateQueries(['posts', serviceSlug]); // تحديث الجدول فوراً
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.Errors?.[0]?.description || "فشل حفظ البوست.";
            toast.error(errorMsg);
        }
    });
};

// 🚀 3. حذف منشور
export const useDeletePost = (serviceSlug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (postId) => deletePostREST(serviceSlug, postId),
        onSuccess: () => {
            toast.success('تم الحذف بنجاح');
            queryClient.invalidateQueries(['posts', serviceSlug]);
        },
        onError: () => toast.error('فشل الحذف.')
    });
};

// 🚀 4. تصفير تقييم المنشور
export const useResetPostRating = (serviceSlug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePostRating,
        onSuccess: () => {
            toast.success('تم تصفير التقييم بنجاح');
            queryClient.invalidateQueries(['posts', serviceSlug]);
        },
        onError: () => toast.error('فشل مسح التقييم.')
    });
};