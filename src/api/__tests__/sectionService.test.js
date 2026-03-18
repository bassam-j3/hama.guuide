import { describe, it, expect, vi } from 'vitest';
import sectionService from '../../api/services/sectionService';
import axiosInstance from '../axiosConfig';

// Mock axios
vi.mock('../axiosConfig', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    }
}));

describe('sectionService API', () => {
    it('fetchAllSections يجب أن يجمع الجذور والأبناء ولا ينهار عند 404', async () => {
        // محاكاة جلب الجذور (تعيد قسم واحد)
        axiosInstance.get.mockResolvedValueOnce({ data: [{ id: 'root1', title: 'Root 1' }] });
        
        // محاكاة جلب أبناء الـ root1 (يعيد 404 لأن ليس لديه أبناء)
        axiosInstance.get.mockRejectedValueOnce({ response: { status: 404 } });

        const sections = await sectionService.fetchAllSections();
        
        expect(sections).toHaveLength(1);
        expect(sections[0].id).toBe('root1');
        expect(axiosInstance.get).toHaveBeenCalledTimes(2); // مرة للجذور ومرة للبحث عن أبناء الجذور
    });

    it('assignChildSection يجب أن يشكل المسار الصحيح', async () => {
        axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });
        
        await sectionService.assignChildSection('parent-123', 'child-456');
        
        expect(axiosInstance.put).toHaveBeenCalledWith('/Sections/parent-123/sections/child-456');
    });
});