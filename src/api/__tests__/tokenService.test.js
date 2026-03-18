import { describe, it, expect, beforeEach } from 'vitest';
import { getAuthData, setAuthData, clearAuthData } from '../services/tokenService';

describe('tokenService (Cache & Storage)', () => {
    beforeEach(() => {
        sessionStorage.clear();
        clearAuthData(); // تنظيف الذاكرة قبل كل اختبار
    });

    it('يجب أن يعيد null إذا لم يكن هناك توكن محفوظ', () => {
        expect(getAuthData()).toBeNull();
    });

    it('يجب أن يحفظ التوكن في الذاكرة السريعة (Cache) والـ SessionStorage', () => {
        const mockData = { access_token: '12345_test_token' };
        setAuthData(mockData);

        // التحقق من أن الدالة تعيد القيمة الصحيحة (من الكاش)
        expect(getAuthData()).toEqual(mockData);

        // التحقق من أن القيمة ذهبت بالفعل إلى SessionStorage كنسخة احتياطية
        const stored = JSON.parse(sessionStorage.getItem("oidc.user:hama.guide:admin"));
        expect(stored).toEqual(mockData);
    });

    it('يجب أن يمسح البيانات من الكاش ومن SessionStorage عند استدعاء clearAuthData', () => {
        setAuthData({ access_token: '123' });
        clearAuthData();
        
        expect(getAuthData()).toBeNull();
        expect(sessionStorage.getItem("oidc.user:hama.guide:admin")).toBeNull();
    });
});