import { describe, it, expect, vi, beforeEach } from 'vitest';
import sectionService from '../services/sectionService';
import axiosInstance from '../axiosConfig';

vi.mock('../axiosConfig', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        post: vi.fn(),
    }
}));

describe('sectionService API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchAllSections uses recursive logic, filters services, and handles 404s gracefully', async () => {
        // 1. Mock root sections (Level 0)
        axiosInstance.get.mockResolvedValueOnce({
            data: [
                { id: 'root1', title: 'Root 1' },
                { id: 'service1', title: 'Masquerading Service', sectionId: '123' } // Should be filtered out
            ]
        });
        
        // 2. Mock children fetch for 'root1' (Returns 404 because it has no children)
        axiosInstance.get.mockRejectedValueOnce({ response: { status: 404 } });

        const sections = await sectionService.fetchAllSections();

        // Verifications
        expect(sections).toHaveLength(1); // The service was successfully dropped!
        expect(sections[0].id).toBe('root1');
        
        // It should have called the API 2 times (Once for roots, once for root1's children)
        expect(axiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('assignChildSection calls the correct PUT endpoint', async () => {
        axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });

        await sectionService.assignChildSection('parent-123', 'child-456');

        expect(axiosInstance.put).toHaveBeenCalledWith('/Sections/parent-123/sections/child-456');
        expect(axiosInstance.put).toHaveBeenCalledTimes(1);
    });
});