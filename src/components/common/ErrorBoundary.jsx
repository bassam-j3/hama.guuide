import React from 'react';
import { ExclamationTriangle, ArrowClockwise } from 'react-bootstrap-icons';
import * as Sentry from "@sentry/react"; // 🚀 استيراد Sentry

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("تم التقاط خطأ بواسطة ErrorBoundary:", error, errorInfo);
    
    // 🚀 إرسال الخطأ والتفاصيل فوراً إلى حسابك في Sentry
    Sentry.captureException(error, { extra: errorInfo });
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center bg-light rounded-3 border border-danger border-opacity-25" style={{ minHeight: '50vh' }}>
            <ExclamationTriangle size={60} className="text-danger mb-3 opacity-75" />
            <h4 className="fw-bold text-dark mb-2">عذراً، حدث خطأ غير متوقع!</h4>
            <p className="text-muted small max-w-md mb-4">
              لقد تم إرسال تقرير بهذا الخطأ إلى فريق الدعم الفني لحله فوراً. يمكنك محاولة تحديث الصفحة.
            </p>
            <button 
              className="btn btn-outline-danger px-4 py-2 d-flex align-items-center gap-2 fw-bold"
              onClick={() => window.location.reload()}
            >
              <ArrowClockwise size={18} /> تحديث الصفحة
            </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;