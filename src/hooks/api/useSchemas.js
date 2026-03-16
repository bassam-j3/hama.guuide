import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schemaService from '../../api/services/schemaService';
import toast from 'react-hot-toast';

// 🚀 1. جلب جميع المخططات (لاحظ الـ export هنا)
export const useAllSchemas = () => {
    return useQuery({
        queryKey: ['schemas'],
        queryFn: schemaService.getAllSchemas,
    });
};

// 🚀 2. حفظ أو تحديث مخطط (لاحظ الـ export هنا)
export const useSaveSchema = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ serviceId, fields }) => schemaService.saveSchema(serviceId, fields),
        onSuccess: (_, variables) => {
            toast.success('تم تحديث المخطط بنجاح!');
            queryClient.invalidateQueries(['schemas']);
            queryClient.invalidateQueries(['schema', variables.serviceId]); 
        },
        onError: () => {
            toast.error('فشل الحفظ. تأكد من توافق البيانات.');
        }
    });
};