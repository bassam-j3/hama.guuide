import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/authConfig';
import axiosInstance from '../axiosConfig';

vi.mock('../axiosConfig', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('login sends correct payload and stores token', async () => {
    const mockResponse = {
      token: 'fake-token',
      refreshToken: 'fake-refresh-token',
      user: { id: 1, name: 'Admin' }
    };
    axiosInstance.post.mockResolvedValue(mockResponse);

    const result = await authService.login('testUser', 'testPass');

    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', { userName: 'testUser', password: 'testPass' });
    expect(result.access_token).toBe('fake-token');
    
    const stored = JSON.parse(sessionStorage.getItem('oidc.user:hama.guide:admin'));
    expect(stored.access_token).toBe('fake-token');
  });
});
