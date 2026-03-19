import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Mock the specific query keys explicitly to prevent "undefined" errors
vi.mock('../../utils/queryKeys', () => ({
    QUERY_KEYS: {
        sections: { list: vi.fn(() => ['sections']), all: ['sections'] },
        services: { list: vi.fn(() => ['services']), all: ['services'] },
        users: { list: vi.fn(() => ['users']) },
    }
}));

// 2. Mock child components that make heavy API calls to isolate the test to the Router logic
vi.mock('../../components/common/Sidebar', () => ({
    default: () => <div data-testid="mock-sidebar">Sidebar Mock</div>
}));

vi.mock('../../components/auth/LoginPage', () => ({
    default: () => <div data-testid="mock-login">Login Page</div>
}));

vi.mock('../../layouts/DashboardLayout', () => ({
    default: () => <div data-testid="mock-dashboard-layout">Dashboard Layout</div>
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
    },
});

describe('App Router & Lazy Loading', () => {
    it('يجب أن يعرض التطبيق بنجاح دون الانهيار بسبب نقص الـ Providers', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        // التطبيق يقوم بالتحويل التلقائي إلى /admin
        // وبما أننا قمنا بمحاكاة DashboardLayout فإنه سيتوقف هنا ويعرضه
        expect(screen.getByTestId('mock-dashboard-layout')).toBeInTheDocument();
    });
});