import { describe, it, expect, vi, beforeEach } from 'vitest';
import sectionService from '../services/sectionService';
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
    // تصفير العدادات قبل كل اختبار لضمان دقة النتائج
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchAllSections يجب أن يطرد الخدمات المتخفية ويجلب الأبناء بشكل متكرر', async () => {
        // 1. محاكاة استجابة الجذور (مستوى 0): قسم صحيح + خدمة متخفية
        axiosInstance.get.mockResolvedValueOnce({ 
            data: [
                { id: 'section1', title: 'Real Section' }, // قسم صحيح
                { id: 'service1', title: 'Fake Section', sectionId: 'some-id' } // خدمة متخفية
            ] 
        });
        
        // 2. محاكاة استجابة البحث عن أبناء section1 (لا يوجد أبناء)
        axiosInstance.get.mockResolvedValueOnce({ data: [] });

        const sections = await sectionService.fetchAllSections();
        
        // التحقق من درع الحماية: يجب أن تعود مصفوفة بطول 1 فقط لأن الخدمة طُردت
        expect(sections).toHaveLength(1);
        expect(sections[0].id).toBe('section1');
        
        // التحقق من الاستدعاءات: استدعاء للجذور + استدعاء للبحث عن أبناء section1 = 2
        expect(axiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('assignChildSection يجب أن يشكل المسار الصحيح', async () => {
        axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });
        
        await sectionService.assignChildSection('parent-123', 'child-456');
        
        expect(axiosInstance.put).toHaveBeenCalledWith('/Sections/parent-123/sections/child-456');
        expect(axiosInstance.put).toHaveBeenCalledTimes(1);
    });
});