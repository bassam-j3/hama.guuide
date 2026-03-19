import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import serviceService from '../../api/services/serviceService';
import toast from 'react-hot-toast';

export const useServices = () => {
    return useQuery({
        queryKey: ['services'],
        queryFn: serviceService.fetchAllServices,
        staleTime: 5 * 60 * 1000,
    });
};

export const useService = (id) => {
    return useQuery({
        queryKey: ['services', id],
        queryFn: () => serviceService.fetchServiceById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: serviceService.createService,
        onSuccess: () => {
            toast.success('تم إنشاء الخدمة بنجاح!');
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['sections'] }); // Invalidate sections tree if nested
        },
        onError: (err) => toast.error(err.message || 'فشل في إنشاء الخدمة.')
    });
};

export const useUpdateService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => serviceService.updateService(id, data),
        onSuccess: (_, variables) => {
            toast.success('تم حفظ تفاصيل الخدمة الأساسية!');
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['services', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['sections'] }); 
        },
        onError: (err) => toast.error(err.message || 'فشل التحديث. تأكد من البيانات.')
    });
};

export const useDeleteService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: serviceService.deleteService,
        onSuccess: () => {
            toast.success('تم حذف الخدمة بنجاح!');
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
        onError: () => toast.error('فشل في حذف الخدمة.')
    });
};