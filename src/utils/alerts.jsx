export const confirmAction = (title, message) => {
    // 🚀 Senior Fix: استخدام نافذة التأكيد القياسية للمتصفح مع Promise
    // هذا يضمن عدم انهيار التطبيق (Crash) بسبب توافقية مكتبة Toast
    return new Promise((resolve) => {
        const confirmed = window.confirm(`${title}\n\n${message}`);
        resolve(confirmed);
    });
};