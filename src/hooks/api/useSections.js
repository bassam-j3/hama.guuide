import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAllSections, 
  fetchSectionsByParent,
  getSectionById,
  createSection,
  updateSection,
  deleteSection, 
  assignChildSection, 
  removeChildSection,
  getSectionServices,
  linkServiceToSection,
  removeServiceFromSection
} from '../../api/services/sectionService';
import toast from 'react-hot-toast';

export const useSections = (parentId = null, level = null) => {
  return useQuery({
    queryKey: ['sections', parentId, level],
    queryFn: () => {
      // 🚀 إذا طلب الـ UI كل الأقسام (لا يوجد بارامترات)، نستخدم الدالة المتكررة
      if (parentId === null && level === null) {
        return fetchAllSections();
      }
      // وإلا نجلب مستوى محدد
      return fetchSectionsByParent(parentId, level);
    },
  });
};

export const useSection = (id) => {
  return useQuery({
    queryKey: ['section', id],
    queryFn: () => getSectionById(id),
    enabled: !!id,
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSection,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sections'] }),
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateSection(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['section', variables.id] });
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      toast.success('تم حذف القسم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
    onError: () => toast.error('فشل الحذف، القسم مرتبط ببيانات أخرى')
  });
};

export const useAssignChildSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }) => assignChildSection(parentId, childId),
    onSuccess: () => {
      toast.success('تم ربط القسم الفرعي بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
    onError: () => toast.error('فشل الربط.')
  });
};

export const useRemoveChildSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parentId, childId }) => removeChildSection(parentId, childId),
    onSuccess: () => {
      toast.success('تم فك الارتباط بنجاح!');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
    onError: () => toast.error('فشل فك الارتباط.')
  });
};

export const useSectionServices = (sectionId) => {
    return useQuery({
      queryKey: ['section-services', sectionId],
      queryFn: () => getSectionServices(sectionId),
      enabled: !!sectionId, 
    });
};

export const useLinkServiceToSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ sectionId, serviceId }) => linkServiceToSection(sectionId, serviceId),
      onSuccess: (_, variables) => {
        toast.success('تم ربط الخدمة بالقسم بنجاح!');
        queryClient.invalidateQueries({ queryKey: ['section-services', variables.sectionId] });
        queryClient.invalidateQueries({ queryKey: ['services'] }); 
      },
      onError: () => toast.error('فشل ربط الخدمة. تأكد من البيانات.')
    });
};

export const useRemoveServiceFromSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ serviceId }) => removeServiceFromSection(serviceId),
      onSuccess: () => {
        toast.success('تم فك ارتباط الخدمة بنجاح');
        queryClient.invalidateQueries({ queryKey: ['section-services'] });
        queryClient.invalidateQueries({ queryKey: ['services'] });
      },
      onError: () => toast.error('فشل فك ارتباط الخدمة.')
    });
};