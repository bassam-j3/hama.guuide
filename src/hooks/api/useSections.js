import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    fetchAllSections, 
    getSectionById, 
    createSection, 
    updateSection, 
    deleteSection 
} from '../../api/services/sectionService';

export const useSections = (parentId = null, level = null) => {
    return useQuery({
        // 🚀 Cache key now properly reacts to parameter changes
        queryKey: ['sections', parentId, level],
        queryFn: () => fetchAllSections(parentId, level),
    });
};

export const useSection = (id) => {
    return useQuery({
        queryKey: ['section', id],
        queryFn: () => getSectionById(id),
        enabled: !!id, // Only run if ID exists
    });
};

export const useCreateSection = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
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
            queryClient.invalidateQueries({ queryKey: ['sections'] });
        },
    });
};