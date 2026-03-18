import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 🚀 استيراد أدوات React Query
import App from '../../App'; // المسار الصحيح بناءً على وجود الملف في src/api/__tests__

// Mock لـ ResizeObserver الذي يتطلبه أحياناً Bootstrap أو Leaflet
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock للمسارات لمنع مشاكل التحميل الكسول (Lazy Loading) في بيئة الاختبار
vi.mock('../../components/auth/LoginPage', () => ({ default: () => <div>Login Page</div> }));

// 🚀 إنشاء QueryClient مخصص للاختبارات فقط لكي لا يتذمر Sidebar
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false, // إيقاف إعادة المحاولة في الاختبارات لتسريعها
        },
    },
});

describe('App Router & Lazy Loading', () => {
    it('يجب أن يعرض التطبيق بنجاح دون الانهيار بسبب نقص الـ Providers', () => {
        const testQueryClient = createTestQueryClient();

        const { container } = render(
            <QueryClientProvider client={testQueryClient}>
                <App />
            </QueryClientProvider>
        );

        // إذا وصل إلى هنا ولم ينهار بسبب Error Boundary أو QueryClient، فالاختبار ناجح
        expect(container).toBeInTheDocument();
    });
});