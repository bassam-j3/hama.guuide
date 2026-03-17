import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllServices, deleteService } from '../../api/services/serviceService';
import toast from 'react-hot-toast';

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: fetchAllServices,
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success('تم حذف الخدمة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['services'] }); 
    },
    onError: () => {
      toast.error('فشل حذف الخدمة، قد تكون مرتبطة ببيانات أخرى');
    }
  });
};