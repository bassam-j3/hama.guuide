import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schemaService from '../../api/services/schemaService';
import { QUERY_KEYS } from '../../utils/queryKeys';
import toast from 'react-hot-toast';

export const useAllSchemas = () => {
    return useQuery({
        queryKey: QUERY_KEYS.schemas.all,
        queryFn: schemaService.getAllSchemas,
    });
};

export const useSaveSchema = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ serviceId, fields }) => schemaService.saveSchema(serviceId, fields),
        onSuccess: () => {
            toast.success('تم تحديث المخطط بنجاح!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schemas.all });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all }); 
        },
        onError: () => {
            toast.error('فشل الحفظ. تأكد من توافق البيانات.');
        }
    });
};