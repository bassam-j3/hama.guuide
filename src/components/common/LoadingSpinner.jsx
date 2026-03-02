import React from 'react';

/**
 * مكون التحميل الاحترافي
 * @param {string} message - الرسالة التي تظهر تحت الأنيميشن
 * @param {boolean} fullPage - إذا كان true، سيغطي الشاشة بالكامل (للتحميل الأولي)
 * @param {string} size - حجم السبينر (sm, md, lg)
 */
const LoadingSpinner = ({ 
  message = 'جاري التحميل...', 
  fullPage = false, 
  size = 'md' 
}) => {
  
  // تحديد الحجم بناءً على الـ Props
  const spinnerSize = size === 'sm' ? '1.5rem' : size === 'lg' ? '4rem' : '3rem';

  const containerStyle = fullPage ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  } : {
    padding: '3rem 0'
  };

  return (
    <div style={containerStyle} className="text-center">
      {/* استخدام Bootstrap Spinner بشكل أساسي مع لمسة Custom */}
      <div 
        className="spinner-border text-success" 
        role="status" 
        style={{ width: spinnerSize, height: spinnerSize, borderWidth: '0.25em' }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      
      {message && (
        <p className="mt-3 fw-bold text-dark opacity-75">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;