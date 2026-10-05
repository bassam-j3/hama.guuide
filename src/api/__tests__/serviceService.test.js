import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAllServices, createService } from '../services/serviceService';
import axiosInstance from '../axiosConfig';

vi.mock('../axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('serviceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchAllServices hits /Services endpoint', async () => {
    const mockData = { items: [{ id: 1, title: 'Service 1' }] };
    axiosInstance.get.mockResolvedValue({ data: mockData });

    const result = await fetchAllServices();

    expect(axiosInstance.get).toHaveBeenCalledWith('/Services');
    expect(result).toEqual(mockData.items);
  });

  it('createService formats payload correctly', async () => {
    axiosInstance.post.mockResolvedValue({ data: { id: 2 } });
    
    await createService({
        title: 'S1',
        slug: 's1',
        sectionId: '123'
    });

    expect(axiosInstance.post).toHaveBeenCalledWith('/Services', {
        title: 'S1',
        slug: 's1',
        description: null,
        imageUrl: null,
        sectionId: '123',
        schema: null
    });
  });
});
