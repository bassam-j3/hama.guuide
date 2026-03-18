import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useForm } from 'react-hook-form';
import PostLocationSection from '../../components/posts/PostLocationSection';

// Wrapper لتهيئة بيئة React Hook Form
const TestWrapper = () => {
    const { control, setValue, register, formState: { errors } } = useForm({
        defaultValues: { latitude: 35.1234, longitude: 36.5678 }
    });
    
    return <PostLocationSection control={control} setValue={setValue} register={register} errors={errors} />;
};

describe('PostLocationSection Component', () => {
    it('يجب أن يعرض المكون بشكل صحيح ويعزل useWatch بنجاح', () => {
        render(<TestWrapper />);
        
        // التحقق من ظهور النص والبيانات الافتراضية
        expect(screen.getByText(/الموقع الجغرافي/i)).toBeInTheDocument();
        expect(screen.getByText(/35.1234/i)).toBeInTheDocument();
        expect(screen.getByText(/36.5678/i)).toBeInTheDocument();
    });
});