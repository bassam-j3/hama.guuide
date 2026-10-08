import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createMemoryRouter, RouterProvider, Link, Outlet } from 'react-router-dom';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import SectionCreatePage from '../../pages/admin/SectionCreatePage';

vi.mock('../../api/services/sectionService', () => ({
    fetchAllSections: vi.fn().mockResolvedValue([]),
    createSection: vi.fn().mockResolvedValue({})
}));

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

    it('blocks navigation when isDirty is true and stays on page when cancelled', () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        const routes = [
            { path: '/', element: <DirtyFormPage isDirty={true} /> },
            { path: '/other', element: <OtherPage /> }
        ];

        const router = createMemoryRouter(routes, { initialEntries: ['/'] });

        render(<RouterProvider router={router} />);

        fireEvent.click(screen.getByText('Go to Other Page'));

        expect(confirmSpy).toHaveBeenCalledWith('لديك تغييرات غير محفوظة. هل أنت متأكد من مغادرة الصفحة؟');
        expect(screen.getByText('Form Page')).toBeInTheDocument();
        expect(screen.queryByText('Other Page')).not.toBeInTheDocument();

        confirmSpy.mockRestore();
    });

    it('intercepts beforeunload event when isDirty is true', () => {
        const routes = [
            { path: '/', element: <DirtyFormPage isDirty={true} /> }
        ];

        const router = createMemoryRouter(routes, { initialEntries: ['/'] });
        render(<RouterProvider router={router} />);

        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(event.returnValue).toBe(false);
    });

    it('mounts SectionCreatePage within Data Router without useBlocker crash', async () => {
        const routes = [
            {
                path: '/',
                element: <Outlet context={{ triggerGlobalRefresh: vi.fn() }} />,
                children: [
                    { path: 'sections/create', element: <SectionCreatePage /> }
                ]
            }
        ];

        const router = createMemoryRouter(routes, { initialEntries: ['/sections/create'] });

        expect(() => {
            render(<RouterProvider router={router} />);
        }).not.toThrow();

        expect(await screen.findByText('إضافة قسم جديد')).toBeInTheDocument();
    });
});


