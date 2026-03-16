import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAllSections, 
  deleteSection, 
  assignChildSection, 
  removeChildSection,
  getSectionServices,
  linkServiceToSection,
  removeServiceFromSection
} from '../../api/services/sectionService';
import toast from 'react-hot-toast';

// 🚀 جلب جميع الأقسام
export const useSections = () => {
  return useQuery({
    queryKey: ['sections'],
    queryFn: fetchAllSections,
  });
};

// 🚀 حذف قسم
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

// ==========================================
// 🌟 إدارة الأقسام الفرعية (Sub-sections)
// ==========================================

export const useAssignChildSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }) => assignChildSection(parentId, childId),
    onSuccess: () => {
      toast.success('تم ربط القسم الفرعي بنجاح');
      queryClient.invalidateQueries(['sections']);
    },
    onError: () => toast.error('فشل ربط القسم الفرعي.')
  });
};

export const useRemoveChildSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }) => removeChildSection(parentId, childId),
    onSuccess: () => {
      toast.success('تم فك ارتباط القسم الفرعي');
      queryClient.invalidateQueries(['sections']);
    },
    onError: () => toast.error('فشل فك الارتباط.')
  });
};

// ==========================================
// 🌟 إدارة ربط الخدمات بالأقسام (Services Linking)
// ==========================================

// 1. جلب الخدمات المرتبطة بقسم محدد
export const useSectionServices = (sectionId) => {
    return useQuery({
      queryKey: ['section-services', sectionId],
      queryFn: () => getSectionServices(sectionId),
      enabled: !!sectionId, // لا تقم بالجلب إذا لم يكن الـ ID موجوداً
    });
};

// 2. ربط خدمة بالقسم
export const useLinkServiceToSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ sectionId, serviceId }) => linkServiceToSection(sectionId, serviceId),
      onSuccess: (_, variables) => {
        toast.success('تم ربط الخدمة بالقسم بنجاح!');
        queryClient.invalidateQueries(['section-services', variables.sectionId]);
        queryClient.invalidateQueries(['services']); 
      },
      onError: () => toast.error('فشل ربط الخدمة. تأكد من البيانات.')
    });
};

// 3. فك ارتباط خدمة من القسم
export const useRemoveServiceFromSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ serviceId }) => removeServiceFromSection(serviceId),
      onSuccess: (_, variables) => {
        toast.success('تم فك ارتباط الخدمة بنجاح');
        queryClient.invalidateQueries(['section-services', variables.sectionId]);
        queryClient.invalidateQueries(['services']);
      },
      onError: () => toast.error('فشل عملية فك الارتباط.')
    });
};