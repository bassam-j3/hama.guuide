import { describe, it, expect, vi } from 'vitest';
import { uploadFile } from '../services/fileService';
import { axiosUploadInstance } from '../axiosConfig';

// Mock the upload instance
vi.mock('../axiosConfig', () => ({
    axiosUploadInstance: {
        post: vi.fn(),
    },
}));

describe('fileService - uploadFile', () => {
    it('يجب أن يرفض العملية إذا لم يتم تمرير ملف', async () => {
        await expect(uploadFile(null)).rejects.toThrow("يرجى اختيار ملف أولاً");
    });

    it('يجب أن يرفض الملفات التي يتجاوز حجمها 10 ميجابايت', async () => {
        const largeFile = { size: 11 * 1024 * 1024, type: 'image/jpeg' }; // 11MB
        await expect(uploadFile(largeFile)).rejects.toThrow("حجم الملف كبير جداً؛ الحد الأقصى هو 10 ميجابايت");
    });

    it('يجب أن يرفض صيغ الملفات غير المدعومة', async () => {
        const invalidFile = { size: 1 * 1024 * 1024, type: 'text/plain' };
        await expect(uploadFile(invalidFile)).rejects.toThrow("صيغة الملف غير مدعومة. يسمح بـ (JPG, PNG, WebP, PDF)");
    });

    it('يجب أن يقوم برفع الملف بنجاح وإرجاع الرابط باستخدام axiosUploadInstance', async () => {
        // Mock successful response
        const mockUrl = 'http://example.com/images/test.png';
        axiosUploadInstance.post.mockResolvedValueOnce({ data: { fileUrl: mockUrl } });

        // Create a valid dummy file
        const validFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
        
        const result = await uploadFile(validFile);
        
        expect(axiosUploadInstance.post).toHaveBeenCalledTimes(1);
        expect(result).toBe(mockUrl);
    });
});