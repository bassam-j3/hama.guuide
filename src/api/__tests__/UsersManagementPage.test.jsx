import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersManagementPage from '../../pages/admin/UsersManagementPage';
import { userService } from '../services/userService';

vi.mock('../services/userService', () => ({
    userService: {
        getAllUsers: vi.fn(),
        createUser: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn()
    }
}));

describe('UsersManagementPage Paginated Rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('correctly extracts users from paginated response object containing items property', async () => {
        const paginatedResponse = {
            items: [
                {
                    id: 'user-123456',
                    userName: 'bassam.admin',
                    email: 'bassam@example.com',
                    phoneNumber: '0912345678',
                    roles: ['Admin']
                }
            ],
            totalCount: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1
        };

        userService.getAllUsers.mockResolvedValueOnce(paginatedResponse);

        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('bassam.admin')).toBeInTheDocument();
            expect(screen.getAllByText('bassam@example.com')[0]).toBeInTheDocument();
            expect(screen.getByText(/1 مستخدم/)).toBeInTheDocument();
        });

    });

    it('correctly extracts users if response is a direct array fallback', async () => {
        const directArrayResponse = [
            {
                id: 'user-789012',
                userName: 'direct.user',
                email: 'direct@example.com',
                phoneNumber: null,
                roles: ['User']
            }
        ];

        userService.getAllUsers.mockResolvedValueOnce(directArrayResponse);

        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('direct.user')).toBeInTheDocument();
        });
    });

    it('renders Pagination component when totalPages > 1', async () => {
        const multiPageResponse = {
            items: [
                {
                    id: 'u1',
                    userName: 'page1.user',
                    email: 'p1@example.com',
                    roles: ['Admin']
                }
            ],
            totalCount: 25,
            page: 1,
            pageSize: 10,
            totalPages: 3
        };

        userService.getAllUsers.mockResolvedValueOnce(multiPageResponse);

        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('page1.user')).toBeInTheDocument();
            expect(screen.getByRole('navigation', { name: /page navigation/i })).toBeInTheDocument();
        });
    });
});
