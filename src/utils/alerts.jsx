import toast from 'react-hot-toast';
import React from 'react';

export const confirmAction = (message, onConfirm) => {
    toast((t) => (
        <div className="text-end animate-fade-in" dir="rtl">
            <h6 className="fw-bold mb-2 text-danger">تأكيد الإجراء</h6>
            <p className="small mb-3 text-secondary">{message}</p>
            <div className="d-flex gap-2 justify-content-end mt-2">
                <button 
                    className="btn btn-sm btn-danger px-3 shadow-sm" 
                    onClick={() => {
                        toast.dismiss(t.id); // إغلاق النافذة
                        onConfirm(); // تنفيذ دالة الحذف أو التعديل
                    }}
                >
                    نعم، تأكيد
                </button>
                <button 
                    className="btn btn-sm btn-light border px-3" 
                    onClick={() => toast.dismiss(t.id)}
                >
                    إلغاء
                </button>
            </div>
        </div>
    ), { 
        duration: Infinity, // لا يختفي حتى يختار المستخدم
        position: 'top-center',
        style: { border: '1px solid #f5c2c7', padding: '16px' }
    });
};