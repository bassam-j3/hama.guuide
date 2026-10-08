import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../services/userService';
import axiosInstance from '../axiosConfig';

vi.mock('../axiosConfig', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createUser', () => {
        it('sanitizes empty phoneNumber to null and formats roles as string', async () => {
            axiosInstance.post.mockResolvedValueOnce({ data: { id: 'u1' } });

            const userData = {
                userName: 'testuser',
                email: 'test@example.com',
                phoneNumber: '   ',
                password: 'Password123!',
                roles: ['ServiceAdmin']
            };

            await userService.createUser(userData);

            expect(axiosInstance.post).toHaveBeenCalledWith('/Users', {
                userName: 'testuser',
                email: 'test@example.com',
                phoneNumber: null,
                password: 'Password123!',
                roles: 'ServiceAdmin'
            });
        });

        it('sanitizes phone number by stripping spaces and plus sign to satisfy regex', async () => {
            axiosInstance.post.mockResolvedValueOnce({ data: { id: 'u2' } });

            const userData = {
                userName: 'phoneuser',
                email: 'phone@example.com',
                phoneNumber: '+1 234-567-890',
                password: 'Password123!',
                roles: 'Admin'
            };

            await userService.createUser(userData);

            expect(axiosInstance.post).toHaveBeenCalledWith('/Users', {
                userName: 'phoneuser',
                email: 'phone@example.com',
                phoneNumber: '1234-567-890',
                password: 'Password123!',
                roles: 'Admin'
            });
        });
    });

    describe('updateUser', () => {
        it('sanitizes empty phoneNumber to null and formats roles as string', async () => {
            axiosInstance.put.mockResolvedValueOnce({ data: { id: 'u1' } });

            const userData = {
                userName: 'updateduser',
                email: 'updated@example.com',
                phoneNumber: '',
                roles: ['Admin']
            };

            await userService.updateUser('u1', userData);

            expect(axiosInstance.put).toHaveBeenCalledWith('/Users/u1', {
                userName: 'updateduser',
                email: 'updated@example.com',
                phoneNumber: null,
                roles: 'Admin'
            });
        });
    });

    describe('getAllUsers', () => {
        it('fetches users with pagination params and returns paginated response', async () => {
            const mockPaginatedData = {
                items: [{ id: 'u1', userName: 'admin', roles: ['Admin'] }],
                totalCount: 1,
                page: 1,
                pageSize: 10,
                totalPages: 1
            };
            axiosInstance.get.mockResolvedValueOnce({ data: mockPaginatedData });

            const result = await userService.getAllUsers(1, 10, 'userName', true);

            expect(axiosInstance.get).toHaveBeenCalledWith('/Users', {
                params: { currentPage: 1, pageSize: 10, sortBy: 'userName', sortAsc: true }
            });
            expect(result).toEqual(mockPaginatedData);
        });
    });
});

