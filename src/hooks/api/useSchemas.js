import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schemaService from '../../api/services/schemaService';
import toast from 'react-hot-toast';

export const useAllSchemas = () => {
    return useQuery({
        queryKey: ['schemas'],
        queryFn: schemaService.getAllSchemas,
    });
};

export const useSaveSchema = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ serviceId, fields }) => schemaService.saveSchema(serviceId, fields),
        onSuccess: (_, variables) => {
            toast.success('تم تحديث المخطط بنجاح!');
            queryClient.invalidateQueries({ queryKey: ['schemas'] });
            queryClient.invalidateQueries({ queryKey: ['schema', variables.serviceId] }); 
        },
        onError: () => {
            toast.error('فشل الحفظ. تأكد من توافق البيانات.');
        }
    });
};