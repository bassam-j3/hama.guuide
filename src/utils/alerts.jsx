import toast from 'react-hot-toast';
import React from 'react';

export const confirmAction = (title, message) => {
    // 🚀 Senior Fix: تحويل الأداة لترجع Promise لتعمل بسلاسة مع async/await
    return new Promise((resolve) => {
        toast((t) => (
            <div className="text-end animate-fade-in" dir="rtl">
                <h6 className="fw-bold mb-2 text-danger">{title || 'تأكيد الإجراء'}</h6>
                <p className="small mb-3 text-secondary">{message || 'هل أنت متأكد من هذا الإجراء؟'}</p>
                <div className="d-flex gap-2 justify-content-end mt-2">
                    <button 
                        className="btn btn-sm btn-danger px-3 shadow-sm" 
                        onClick={() => {
                            toast.dismiss(t.id);
                            resolve(true); // المستخدم وافق
                        }}
                    >
                        نعم، تأكيد
                    </button>
                    <button 
                        className="btn btn-sm btn-light border px-3" 
                        onClick={() => {
                            toast.dismiss(t.id);
                            resolve(false); // المستخدم تراجع
                        }}
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        ), { 
            duration: Infinity,
            position: 'top-center',
            style: { border: '1px solid #f5c2c7', padding: '16px' }
        });
    });
};