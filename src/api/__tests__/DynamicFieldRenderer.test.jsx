import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DynamicFieldRenderer from '../../components/posts/DynamicFieldRenderer';

describe('DynamicFieldRenderer Pattern', () => {
    const mockOnChange = vi.fn();

    it('يجب أن يعرض حقل نصي (String) بشكل افتراضي إذا لم يتم إرسال نوع حقل معقد', () => {
        const fieldSchema = { fieldName: 'testString', fieldType: 'String', isRequired: true };
        render(<DynamicFieldRenderer fieldSchema={fieldSchema} value="" onChange={mockOnChange} />);
        
        expect(screen.getByText(/testString/i)).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('يجب أن يعرض حقل رقمي (Int) عندما يكون النوع Int', () => {
        const fieldSchema = { fieldName: 'testInt', fieldType: 'Int' };
        render(<DynamicFieldRenderer fieldSchema={fieldSchema} value={10} onChange={mockOnChange} />);
        
        const input = screen.getByRole('spinbutton'); // Role الخاص بحقول الأرقام
        expect(input).toBeInTheDocument();
        expect(input.value).toBe('10');
    });

    it('يجب أن يعرض حقل مفتاح (Switch) عندما يكون النوع Bool', () => {
        const fieldSchema = { fieldName: 'testBool', fieldType: 'Bool' };
        render(<DynamicFieldRenderer fieldSchema={fieldSchema} value={true} onChange={mockOnChange} />);
        
        expect(screen.getByRole('switch')).toBeInTheDocument();
    });
});