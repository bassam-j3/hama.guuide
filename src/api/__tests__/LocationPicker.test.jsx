import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LocationPicker from '../../components/common/LocationPicker';

describe('LocationPicker Component', () => {
    it('يجب أن يعرض زر فتح الخريطة بشكل صحيح عندما لا يوجد موقع محدد مسبقاً', () => {
        render(<LocationPicker onLocationSelect={() => {}} />);
        const button = screen.getByRole('button', { name: /تحديد على الخريطة/i });
        expect(button).toBeInTheDocument();
    });

    it('يجب أن يعرض نص "تغيير الموقع" إذا تم تمرير إحداثيات مبدئية', () => {
        render(<LocationPicker onLocationSelect={() => {}} initialLat={35.1} initialLng={36.7} />);
        const button = screen.getByRole('button', { name: /تغيير الموقع/i });
        expect(button).toBeInTheDocument();
    });
});