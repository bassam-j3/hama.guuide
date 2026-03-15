// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

/**
 * Custom Hook to debounce a value
 * @param {any} value - القيمة التي نريد تأخيرها (مثل نص البحث)
 * @param {number} delay - مدة التأخير بالميلي ثانية (مثلاً 300)
 * @returns {any} - القيمة بعد التأخير
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // إعداد مؤقت (Timer) لتحديث القيمة بعد المدة المحددة
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // دالة التنظيف (Cleanup): إذا تغيرت القيمة قبل انتهاء الوقت، نلغي المؤقت القديم
    // هذا يضمن أن القيمة لن تتحدث إلا إذا توقف المستخدم عن الكتابة تماماً
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // يعمل الـ useEffect فقط إذا تغيرت القيمة أو المدة

  return debouncedValue;
}