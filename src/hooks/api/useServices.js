import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllServices,
  fetchServiceById,
  createService,
  updateService,
  deleteService
} from '../../api/services/serviceService';
import { QUERY_KEYS } from '../../utils/queryKeys';
import toast from 'react-hot-toast';

export const useServices = () => {
  return useQuery({
    queryKey: QUERY_KEYS.services.list(),
    queryFn: fetchAllServices,
  });
};

export const useService = (id) => {
  return useQuery({
    queryKey: QUERY_KEYS.services.detail(id),
    queryFn: () => fetchServiceById(id),
    enabled: !!id,
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      toast.success('تم إضافة الخدمة بنجاح');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'فشل في إضافة الخدمة. تأكد من صحة البيانات.');
    }
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateService(id, data),
    onSuccess: () => {
      toast.success('تم تحديث الخدمة بنجاح');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all });
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'فشل في تحديث الخدمة.');
    }
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success('تم حذف الخدمة بنجاح');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all });
    },
    onError: (err) => {
      if (err.response?.status === 409 || err.response?.status === 400) {
        toast.error('لا يمكن حذف الخدمة لارتباطها ببيانات أخرى (مثل البوستات أو المخططات).');
      } else {
        toast.error('فشل الحذف. الرجاء المحاولة لاحقاً.');
      }
    }
  });
};