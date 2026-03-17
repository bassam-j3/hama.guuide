import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    fetchPostsByServiceSlug, 
    createPostREST, 
    updatePostREST, 
    deletePostREST,
    deletePostRating
} from '../../api/services/postService';
import toast from 'react-hot-toast';

export const usePostsBySlug = (serviceSlug) => {
    return useQuery({
        queryKey: ['posts', serviceSlug],
        queryFn: () => fetchPostsByServiceSlug(serviceSlug),
        enabled: !!serviceSlug, 
    });
};

export const useCreatePost = (serviceSlug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (postData) => createPostREST(serviceSlug, postData),
        onSuccess: () => {
            toast.success('تم نشر البوست بنجاح!');
            queryClient.invalidateQueries({ queryKey: ['posts', serviceSlug] }); 
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.detail || "فشل حفظ البوست.";
            toast.error(errorMsg);
        }
    });
};

export const useDeletePost = (serviceSlug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (postId) => deletePostREST(serviceSlug, postId),
        onSuccess: () => {
            toast.success('تم الحذف بنجاح');
            queryClient.invalidateQueries({ queryKey: ['posts', serviceSlug] });
        },
        onError: () => toast.error('فشل الحذف.')
    });
};

export const useResetPostRating = (serviceSlug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePostRating,
        onSuccess: () => {
            toast.success('تم مسح التقييم بنجاح');
            queryClient.invalidateQueries({ queryKey: ['posts', serviceSlug] });
        },
        onError: () => toast.error('فشل مسح التقييم.')
    });
};