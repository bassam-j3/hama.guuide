import React from 'react';
import { ExclamationTriangleFill, ArrowClockwise } from 'react-bootstrap-icons';

/**
 * مكون عرض الأخطاء الاحترافي
 * @param {string|object} message - رسالة الخطأ (نص أو كائن Error)
 * @param {function} onRetry - دالة إعادة المحاولة
 * @param {boolean} inline - إذا كان true سيظهر كـ Alert بسيط، وإذا false سيظهر كـ Card مركزي
 */
const ErrorMessage = ({ message, onRetry, inline = true }) => {
  
  // استخراج النص من الخطأ بشكل آمن (بناءً على نظام ProblemDetails في الباك إند)
  const getDisplayMessage = () => {
    if (typeof message === 'string') return message;
    if (message?.message) return message.message;
    return 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.';
  };

  const displayMessage = getDisplayMessage();

  // تنسيق الـ Alert البسيط (لداخل النماذج أو الجداول)
  if (inline) {
    return (
      <div className="alert alert-danger d-flex align-items-center justify-content-between shadow-sm animate-fade-in" role="alert">
        <div className="d-flex align-items-center">
          <ExclamationTriangleFill size={20} className="ms-3 text-danger" />
          <span className="fw-medium">{displayMessage}</span>
        </div>
        {onRetry && (
          <button 
            className="btn btn-sm btn-danger d-flex align-items-center gap-2" 
            onClick={onRetry}
          >
            <ArrowClockwise size={14} />
            إعادة المحاولة
          </button>
        )}
      </div>
    );
  }

  // تنسيق الـ Full Page/Card (عند فشل تحميل الصفحة بالكامل)
  return (
    <div className="text-center py-5 px-3">
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
        <div className="card-body p-5">
          <div className="mb-4">
            <div className="bg-danger bg-opacity-10 d-inline-block p-4 rounded-circle">
              <ExclamationTriangleFill size={48} className="text-danger" />
            </div>
          </div>
          <h4 className="fw-bold text-dark">خطأ في الاتصال</h4>
          <p className="text-muted mb-4">{displayMessage}</p>
          {onRetry && (
            <button 
              className="btn btn-danger px-4 py-2 d-inline-flex align-items-center gap-2" 
              onClick={onRetry}
            >
              <ArrowClockwise size={18} />
              تحديث البيانات
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;