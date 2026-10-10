const STORAGE_KEY = "oidc.user:hama.guide:admin";
let cachedAuthData = null; // ذاكرة تخزين مؤقتة سريعة جداً (In-Memory Cache)

export const getAuthData = () => {
    // 🚀 Senior Fix: قراءة الذاكرة المؤقتة أولاً لتجنب JSON.parse المتكرر
    if (cachedAuthData) return cachedAuthData;
    
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY) || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
        if (storedData) {
            cachedAuthData = JSON.parse(storedData);
            return cachedAuthData;
        }
    } catch {
        return null;
    }
    return null;
};

export const setAuthData = (authData) => {
    cachedAuthData = authData; // تحديث الكاش
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    if (typeof localStorage !== 'undefined') {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(authData)); } catch { /* ignore */ }
    }
};

export const clearAuthData = () => {
    cachedAuthData = null; // مسح الكاش
    sessionStorage.removeItem(STORAGE_KEY);
    if (typeof localStorage !== 'undefined') {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
};