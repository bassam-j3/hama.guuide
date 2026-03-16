import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// استيراد صحيح 100% لأنك تستخدم export default
import LoadingSpinner from './LoadingSpinner'; 

describe('LoadingSpinner Component', () => {
    
    it('يجب أن يعرض رسالة التحميل الافتراضية إذا لم نمرر له رسالة', () => {
        render(<LoadingSpinner />);
        // نبحث عن النص في الشاشة الوهمية
        const defaultMessage = screen.getByText(/جاري التحميل/i);
        expect(defaultMessage).toBeInTheDocument();
    });

    it('يجب أن يعرض الرسالة المخصصة التي نمررها له', () => {
        const customMsg = "جاري جلب بيانات الأطباء...";
        render(<LoadingSpinner message={customMsg} />);
        
        // نتأكد أن رسالتنا المخصصة موجودة
        const messageElement = screen.getByText(customMsg);
        expect(messageElement).toBeInTheDocument();
    });
});