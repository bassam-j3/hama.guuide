import * as z from 'zod';

// 🚀 Senior Refactor: استخراج منطق بناء الـ Zod Schema المعقد خارج الواجهة
export const buildDynamicSchema = (schemaFields) => {
    const payloadShape = {};
    
    schemaFields.forEach(field => {
        let fieldValidator = z.any();
        
        if (field.fieldType === 'String' || field.fieldType === 'Email' || field.fieldType === 'PhoneNumber') {
            fieldValidator = z.string();
            if (field.isRequired) fieldValidator = fieldValidator.min(1, 'هذا الحقل مطلوب');
            else fieldValidator = fieldValidator.optional().or(z.literal(''));
            
            if (field.fieldType === 'Email') fieldValidator = fieldValidator.email('بريد إلكتروني غير صالح');
        } 
        else if (field.fieldType === 'Int' || field.fieldType === 'Float' || field.fieldType === 'Decimal') {
            fieldValidator = z.preprocess(
                (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)), 
                field.isRequired ? z.number({ invalid_type_error: 'يجب إدخال رقم صالح' }) : z.number().optional()
            );
        } 
        else if (field.fieldType === 'Bool') {
            fieldValidator = z.boolean().optional();
        } else {
            fieldValidator = field.isRequired ? z.string().min(1, 'مطلوب') : z.any().optional();
        }

        payloadShape[field.fieldName] = fieldValidator;
    });

    return z.object({
        title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
        imageUrl: z.string().optional().or(z.literal('')),
        latitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
        longitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
        payload: z.object(payloadShape) 
    });
};

// 🚀 Senior Refactor: استخراج منطق توليد الحقول الافتراضية
export const generateDefaultPayload = (schemaFields, existingPayload = {}) => {
    const payload = {};
    schemaFields.forEach(field => {
        const existingValue = existingPayload[field.fieldName];
        payload[field.fieldName] = existingValue !== undefined 
            ? existingValue 
            : (field.fieldType === 'Bool' ? false : "");
    });
    return payload;
};