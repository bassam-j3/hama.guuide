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

describe('UsersManagementPage Mutation Synchronization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('refetches users, closes modal, and shows success toast after creating a user', async () => {
        const initialUsers = { items: [], totalCount: 0, totalPages: 1 };
        const updatedUsers = {
            items: [{ id: 'new-id', userName: 'new.user', email: 'new@example.com', roles: ['Admin'] }],
            totalCount: 1,
            totalPages: 1
        };

        userService.getAllUsers
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce(updatedUsers);
        userService.createUser.mockResolvedValueOnce({ id: 'new-id', userName: 'new.user' });

        const { fireEvent } = await import('@testing-library/react');
        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('لا يوجد مستخدمين.')).toBeInTheDocument();
        });

        // Open modal
        fireEvent.click(screen.getByRole('button', { name: /إضافة مستخدم/i }));
        expect(screen.getByText('إضافة مستخدم', { selector: '.modal-title' })).toBeInTheDocument();

        // Fill form
        fireEvent.change(screen.getByLabelText('اسم المستخدم'), { target: { value: 'new.user' } });
        fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'new@example.com' } });
        fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'Password123!' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: 'تأكيد' }));

        await waitFor(() => {
            expect(userService.createUser).toHaveBeenCalledTimes(1);
            expect(userService.getAllUsers).toHaveBeenCalledTimes(2);
            expect(screen.getByText('new.user')).toBeInTheDocument();
        });
    });

    it('refetches users, closes modal, and shows success toast after editing a user', async () => {
        const initialUsers = {
            items: [{ id: 'user-1', userName: 'initial.name', email: 'edit@example.com', roles: ['Admin'] }],
            totalCount: 1,
            totalPages: 1
        };
        const updatedUsers = {
            items: [{ id: 'user-1', userName: 'updated.name', email: 'edit@example.com', roles: ['Admin'] }],
            totalCount: 1,
            totalPages: 1
        };

        userService.getAllUsers
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce(updatedUsers);
        userService.updateUser.mockResolvedValueOnce({ id: 'user-1', userName: 'updated.name' });

        const { fireEvent } = await import('@testing-library/react');
        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('initial.name')).toBeInTheDocument();
        });

        // Click edit button
        const editButton = screen.getByRole('table').querySelector('tbody tr td button:first-child');
        fireEvent.click(editButton);

        expect(screen.getByText('تعديل مستخدم', { selector: '.modal-title' })).toBeInTheDocument();

        // Edit username
        fireEvent.change(screen.getByLabelText('اسم المستخدم'), { target: { value: 'updated.name' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: 'تأكيد' }));

        await waitFor(() => {
            expect(userService.updateUser).toHaveBeenCalledTimes(1);
            expect(userService.getAllUsers).toHaveBeenCalledTimes(2);
            expect(screen.getByText('updated.name')).toBeInTheDocument();
        });
    });

    it('refetches users and shows success toast after deleting a user', async () => {
        const initialUsers = {
            items: [{ id: 'user-1', userName: 'to.delete', email: 'del@example.com', roles: ['Admin'] }],
            totalCount: 1,
            totalPages: 1
        };
        const emptyUsers = { items: [], totalCount: 0, totalPages: 1 };

        userService.getAllUsers
            .mockResolvedValueOnce(initialUsers)
            .mockResolvedValueOnce(emptyUsers);
        userService.deleteUser.mockResolvedValueOnce({});

        window.confirm = vi.fn(() => true);

        const { fireEvent } = await import('@testing-library/react');
        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('to.delete')).toBeInTheDocument();
        });

        // Click delete button
        const deleteButton = screen.getByRole('table').querySelector('tbody tr td button:last-child');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledTimes(1);
            expect(userService.deleteUser).toHaveBeenCalledWith('user-1');
            expect(userService.getAllUsers).toHaveBeenCalledTimes(2);
            expect(screen.getByText('لا يوجد مستخدمين.')).toBeInTheDocument();
        });
    });

    it('strictly submits User B data and id when editing User B after User A without stale state bleeding', async () => {
        const twoUsers = {
            items: [
                { id: 'user-a', userName: 'user.alpha', email: 'alpha@example.com', phoneNumber: '111', roles: ['Admin'] },
                { id: 'user-b', userName: 'user.beta', email: 'beta@example.com', phoneNumber: '222', roles: ['User'] }
            ],
            totalCount: 2,
            totalPages: 1
        };

        userService.getAllUsers.mockResolvedValue(twoUsers);
        userService.updateUser.mockResolvedValue({ success: true });

        const { fireEvent } = await import('@testing-library/react');
        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('user.alpha')).toBeInTheDocument();
            expect(screen.getByText('user.beta')).toBeInTheDocument();
        });

        const rows = screen.getByRole('table').querySelectorAll('tbody tr');
        const editButtonA = rows[0].querySelector('td button:first-child');
        const editButtonB = rows[1].querySelector('td button:first-child');

        // 1. Open User A and cancel
        fireEvent.click(editButtonA);
        expect(screen.getByLabelText('اسم المستخدم')).toHaveValue('user.alpha');
        fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));

        // 2. Open User B
        fireEvent.click(editButtonB);
        expect(screen.getByLabelText('اسم المستخدم')).toHaveValue('user.beta');

        // Modify User B
        fireEvent.change(screen.getByLabelText('اسم المستخدم'), { target: { value: 'user.beta.updated' } });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: 'تأكيد' }));

        await waitFor(() => {
            expect(userService.updateUser).toHaveBeenCalledTimes(1);
            expect(userService.updateUser).toHaveBeenCalledWith('user-b', expect.objectContaining({
                userName: 'user.beta.updated',
                email: 'beta@example.com'
            }));
            // Ensure User A's id was never called
            expect(userService.updateUser).not.toHaveBeenCalledWith('user-a', expect.anything());
        });
    });

    it('clears form state and selectedUser when modal is closed', async () => {
        const usersData = {
            items: [
                { id: 'user-a', userName: 'user.alpha', email: 'alpha@example.com', phoneNumber: '111', roles: ['Admin'] }
            ],
            totalCount: 1,
            totalPages: 1
        };

        userService.getAllUsers.mockResolvedValue(usersData);

        const { fireEvent } = await import('@testing-library/react');
        render(<UsersManagementPage />);

        await waitFor(() => {
            expect(screen.getByText('user.alpha')).toBeInTheDocument();
        });

        // Edit user A
        const editBtn = screen.getByRole('table').querySelector('tbody tr td button:first-child');
        fireEvent.click(editBtn);
        expect(screen.getByLabelText('اسم المستخدم')).toHaveValue('user.alpha');

        // Cancel modal
        fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }));

        // Open Create User modal
        fireEvent.click(screen.getByRole('button', { name: /إضافة مستخدم/i }));

        // Ensure input fields are empty/initial, not retaining User A's data
        expect(screen.getByLabelText('اسم المستخدم')).toHaveValue('');
        expect(screen.getByLabelText('البريد الإلكتروني')).toHaveValue('');
    });
});


