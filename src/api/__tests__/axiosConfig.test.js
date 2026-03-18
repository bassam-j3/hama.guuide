import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import axiosInstance from '../axiosConfig';
import { getAuthData, setAuthData, clearAuthData } from '../services/tokenService';
import { authEvents } from '../../utils/authEvents';

vi.mock('../services/tokenService', () => ({
    getAuthData: vi.fn(),
    setAuthData: vi.fn(),
    clearAuthData: vi.fn(),
}));

vi.mock('axios', async (importOriginal) => {
    const actual = await importOriginal();
    const axiosMock = vi.fn((config) => Promise.resolve({ data: 'mocked_retry' }));
    axiosMock.create = actual.default.create;
    axiosMock.post = vi.fn();
    return { default: axiosMock };
});

describe('axiosConfig Refresh Token Logic', () => {
    let errorInterceptor;

    beforeEach(() => {
        vi.clearAllMocks();
        errorInterceptor = axiosInstance.interceptors.response.handlers[0].rejected;
    });

    it('should emit logout event on refresh failure instead of hard reload', async () => {
        const mockError = {
            config: { _retry: false },
            response: { status: 401 }
        };
        
        getAuthData.mockReturnValue({ refresh_token: 'invalid_token' });
        axios.post.mockRejectedValueOnce(new Error('Refresh failed'));
        
        const emitSpy = vi.spyOn(authEvents, 'emit');

        await expect(errorInterceptor(mockError)).rejects.toThrow('Refresh failed');
        
        expect(clearAuthData).toHaveBeenCalledTimes(1);
        expect(emitSpy).toHaveBeenCalledWith('logout');
    });

    it('should refresh token and retry original request on single 401', async () => {
        const mockError = {
            config: { headers: {} },
            response: { status: 401 }
        };

        getAuthData.mockReturnValue({ refresh_token: 'valid_refresh' });
        axios.post.mockResolvedValueOnce({ data: { token: 'new_token' } });

        const result = await errorInterceptor(mockError);

        // FIXED: Removed the trailing `undefined, undefined` 
        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/refresh'));
        expect(setAuthData).toHaveBeenCalledWith({ refresh_token: 'valid_refresh', access_token: 'new_token' });
        expect(axios).toHaveBeenCalledWith(expect.objectContaining({ headers: { Authorization: 'Bearer new_token' } }));
        expect(result).toEqual({ data: 'mocked_retry' });
    });

    it('should handle concurrent 401s by triggering only one refresh request', async () => {
        const mockError1 = { config: { headers: {} }, response: { status: 401 } };
        const mockError2 = { config: { headers: {} }, response: { status: 401 } };
        const mockError3 = { config: { headers: {} }, response: { status: 401 } };

        getAuthData.mockReturnValue({ refresh_token: 'valid_refresh' });
        
        // Slight delay to simulate network latency for the queue to build up
        axios.post.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: { token: 'new_token_concurrent' } }), 50)));

        const promise1 = errorInterceptor(mockError1);
        const promise2 = errorInterceptor(mockError2);
        const promise3 = errorInterceptor(mockError3);

        const results = await Promise.all([promise1, promise2, promise3]);

        expect(axios.post).toHaveBeenCalledTimes(1); // Crucial: Only ONE refresh call made
        expect(results).toHaveLength(3); // All 3 requests successfully resolved
        expect(axios).toHaveBeenCalledTimes(3); // All 3 original requests were retried
    });
});