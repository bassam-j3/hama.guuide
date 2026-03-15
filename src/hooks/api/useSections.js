import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAllSections, 
  deleteSection, 
  assignChildSection, 
  removeChildSection 
} from '../../api/services/sectionService';
import toast from 'react-hot-toast';

// جلب جميع الأقسام
export const useSections = () => {
  return useQuery({
    queryKey: ['sections'],
    queryFn: fetchAllSections,
  });
};

// حذف قسم
export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      toast.success('تم حذف القسم بنجاح');
      queryClient.invalidateQueries(['sections']);
    },
    onError: () => toast.error('فشل الحذف، القسم مرتبط ببيانات أخرى')
  });
};

// 🚀 إضافة: ربط قسم بقسم آخر (نقل/سحب وإفلات)
export const useAssignChildSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }) => assignChildSection(parentId, childId),
    onSuccess: () => {
      toast.success('تم نقل القسم بنجاح');
      queryClient.invalidateQueries(['sections']);
    },
    onError: () => toast.error('فشل نقل القسم')
  });
};

// 🚀 إضافة: فك ارتباط قسم (جعله رئيساً)
export const useRemoveChildSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }) => removeChildSection(parentId, childId),
    onSuccess: () => {
      toast.success('تم فك الارتباط بنجاح');
      queryClient.invalidateQueries(['sections']);
    },
    onError: () => toast.error('فشل عملية فك الارتباط')
  });
};