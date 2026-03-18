import { describe, it, expect } from 'vitest';
import { buildDynamicSchema, generateDefaultPayload } from '../../utils/schemaBuilder';

describe('schemaBuilder Utility', () => {
    it('يجب أن يفرض قواعد التحقق الأساسية مثل طول العنوان', () => {
        const schema = buildDynamicSchema([]);
        const result = schema.safeParse({ title: 'ab' }); // قصير جداً
        expect(result.success).toBe(false);
        expect(result.error.issues[0].message).toBe('العنوان يجب أن يكون 3 أحرف على الأقل');
    });

    it('يجب أن يحول حقول Int إلى أرقام ويتحقق من الحقول الإجبارية', () => {
        const fields = [{ fieldName: 'age', fieldType: 'Int', isRequired: true }];
        const schema = buildDynamicSchema(fields);
        
        // فشل إذا لم نرسل age
        const failResult = schema.safeParse({ title: 'Valid Title', payload: {} });
        expect(failResult.success).toBe(false);
        
        // تحويل '25' النصية إلى رقم بنجاح
        const successResult = schema.safeParse({ title: 'Valid Title', payload: { age: '25' } });
        expect(successResult.success).toBe(true);
        expect(successResult.data.payload.age).toBe(25);
    });

    it('generateDefaultPayload يجب أن يولد البيانات الافتراضية الصحيحة', () => {
        const fields = [
            { fieldName: 'isActive', fieldType: 'Bool' },
            { fieldName: 'notes', fieldType: 'String' }
        ];
        
        const defaultPayload = generateDefaultPayload(fields, { notes: 'موجود مسبقاً' });
        
        expect(defaultPayload.isActive).toBe(false); // Default for Bool
        expect(defaultPayload.notes).toBe('موجود مسبقاً'); // Keep existing
    });
});