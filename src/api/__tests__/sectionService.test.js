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

    it('fetchAllSections fetches flat list without recursion', async () => {
        const mockData = [
            { id: '1', title: 'Section 1' },
            { id: '2', title: 'Service hiding as section', sectionId: '123' } 
        ];

        axiosInstance.get.mockResolvedValueOnce({ data: mockData });

        const sections = await sectionService.fetchAllSections();

        expect(axiosInstance.get).toHaveBeenCalledWith('/Sections?level=0');
        expect(axiosInstance.get).toHaveBeenCalledTimes(1); 
        expect(sections).toHaveLength(1); 
        expect(sections[0].id).toBe('1');
    });

    it('assignChildSection calls the correct PUT endpoint', async () => {
        axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });

        await sectionService.assignChildSection('parent-123', 'child-456');

        expect(axiosInstance.put).toHaveBeenCalledWith('/Sections/parent-123/sections/child-456');
        expect(axiosInstance.put).toHaveBeenCalledTimes(1);
    });
});