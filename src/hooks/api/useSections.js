import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sectionService from '../../api/services/sectionService';
import { QUERY_KEYS } from '../../utils/queryKeys';
import toast from 'react-hot-toast';

export const useSections = (parentId = null, level = null) => {
    return useQuery({
        queryKey: QUERY_KEYS.sections.list(parentId, level),
        queryFn: () => {
            if (parentId === null && level === null) {
                return sectionService.fetchAllSections();
            }
            return sectionService.fetchSectionsByParent(parentId, level);
        },
        staleTime: 5 * 60 * 1000, 
    });
};

export const useSection = (id) => {
    return useQuery({
        queryKey: QUERY_KEYS.sections.detail(id),
        queryFn: () => sectionService.getSectionById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: sectionService.createSection,
      onSuccess: () => {
          toast.success('تم إضافة القسم بنجاح');
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all }); // 👈 هنا السر
      }
  });
};
export const useUpdateSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: ({ id, data }) => sectionService.updateSection(id, data),
      onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all }); // 👈 تحديث الشجرة
      }
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: sectionService.deleteSection,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all }); // 👈 تحديث الشجرة
      }
  });
};

export const useAssignChildSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ parentId, childId }) => sectionService.assignChildSection(parentId, childId),
        onSuccess: () => {
            toast.success('تم ربط القسم الفرعي بنجاح!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all });
        },
        onError: () => toast.error('فشل الربط.')
    });
};

export const useRemoveChildSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ parentId, childId }) => sectionService.removeChildSection(parentId, childId),
        onSuccess: () => {
            toast.success('تم فك الارتباط بنجاح!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all });
        },
        onError: () => toast.error('فشل فك الارتباط.')
    });
};

export const useSectionServices = (sectionId) => {
    return useQuery({
        queryKey: QUERY_KEYS.sections.services(sectionId),
        queryFn: () => sectionService.getSectionServices(sectionId),
        enabled: !!sectionId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useLinkServiceToSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sectionId, serviceId }) => sectionService.linkServiceToSection(sectionId, serviceId),
        onSuccess: () => {
            toast.success('تم ربط الخدمة بالقسم بنجاح!');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
        },
        onError: () => toast.error('فشل ربط الخدمة. تأكد من البيانات.')
    });
};

export const useRemoveServiceFromSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ serviceId }) => sectionService.removeServiceFromSection(serviceId),
        onSuccess: () => {
            toast.success('تم فك ارتباط الخدمة بنجاح');
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sections.all });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services.all });
        },
        onError: () => toast.error('فشل فك ارتباط الخدمة.')
    });
};