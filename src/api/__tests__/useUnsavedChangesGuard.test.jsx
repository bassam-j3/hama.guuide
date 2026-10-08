import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createMemoryRouter, RouterProvider, Link } from 'react-router-dom';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

const DirtyFormPage = ({ isDirty = true }) => {
    useUnsavedChangesGuard(isDirty);
    return (
        <div>
            <h1>Form Page</h1>
            <Link to="/other">Go to Other Page</Link>
        </div>
    );
};

const OtherPage = () => <h1>Other Page</h1>;

describe('useUnsavedChangesGuard within Data Router', () => {
    it('executes useBlocker successfully inside a data router without crashing', () => {
        const routes = [
            { path: '/', element: <DirtyFormPage isDirty={false} /> },
            { path: '/other', element: <OtherPage /> }
        ];

        const router = createMemoryRouter(routes, { initialEntries: ['/'] });

        expect(() => {
            render(<RouterProvider router={router} />);
        }).not.toThrow();

        expect(screen.getByText('Form Page')).toBeInTheDocument();
    });

    it('blocks navigation when isDirty is true and proceeds on confirm', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        const routes = [
            { path: '/', element: <DirtyFormPage isDirty={true} /> },
            { path: '/other', element: <OtherPage /> }
        ];

        const router = createMemoryRouter(routes, { initialEntries: ['/'] });

        render(<RouterProvider router={router} />);

        fireEvent.click(screen.getByText('Go to Other Page'));

        expect(confirmSpy).toHaveBeenCalledWith('لديك تغييرات غير محفوظة. هل أنت متأكد من مغادرة الصفحة؟');
        confirmSpy.mockRestore();
    });
});
