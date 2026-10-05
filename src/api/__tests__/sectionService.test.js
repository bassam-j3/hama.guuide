import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAllSections } from '../services/sectionService';
import axiosInstance from '../axiosConfig';

vi.mock('../axiosConfig', () => ({
  default: {
    get: vi.fn(),
  }
}));

describe('sectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchAllSections uses /all endpoint', async () => {
    const mockData = { items: [{ id: 1, title: 'Section 1' }] };
    axiosInstance.get.mockResolvedValue({ data: mockData });

    const result = await fetchAllSections();

    expect(axiosInstance.get).toHaveBeenCalledWith('/Sections/all');
    expect(result).toEqual(mockData.items);
  });
});