import React, { useState, useEffect } from 'react';
import { PersonBadge, Envelope, ShieldLock, Key } from 'react-bootstrap-icons';
import authService from '../../api/services/authConfig';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // نطلب البيانات من السيرفر للتأكد من تحديثها
                const data = await authService.getMe();
                setUser(data);
            } catch (err) {
                // إذا فشل الاتصال، نقرأ من الـ Session المتاحة
                setUser(authService.getCurrentUser());
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handlePasswordResetRequest = async () => {
        if (!user?.email) return toast.error("لا يوجد بريد إلكتروني مرتبط بحسابك.");
        
        if (!window.confirm("هل تريد إرسال رابط إعادة تعيين كلمة المرور إلى بريدك؟")) return;

        const toastId = toast.loading('جاري إرسال الطلب...');
        setSubmitting(true);
        try {
            await authService.requestPasswordReset(user.email);
            toast.success("تم إرسال تعليمات تغيير كلمة المرور لبريدك!", { id: toastId });
        } catch (err) {
            toast.error("فشل في إرسال الطلب.", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="جاري جلب الملف الشخصي..." />;

    return (
        <div className="profile-page animate-fade-in text-end" dir="rtl">
            <h3 className="fw-bold mb-4 text-dark">الملف الشخصي</h3>
            
            <div className="row g-4">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4 text-center">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-4 mb-3">
                                <PersonBadge size={64} />
                            </div>
                            <h4 className="fw-bold mb-1">{user?.username || 'مدير النظام'}</h4>
                            <p className="text-muted d-flex align-items-center justify-content-center gap-2 mb-4">
                                <Envelope /> {user?.email || 'لا يوجد بريد إلكتروني'}
                            </p>
                            <span className="badge bg-dark px-4 py-2" style={{fontSize: '0.9rem'}}>
                                الدور: {user?.role || (user?.roles && user.roles[0]) || 'Admin'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-4 border-bottom pb-3"><ShieldLock className="me-2 text-danger"/> الأمان وإعدادات الحساب</h5>
                            
                            <p className="text-muted small mb-4">
                                يمكنك طلب إعادة تعيين كلمة المرور الخاصة بك. سيتم إرسال رابط آمن إلى بريدك الإلكتروني المسجل لدينا لتتمكن من اختيار كلمة مرور جديدة.
                            </p>

                            <button 
                                className="btn btn-outline-danger w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                                onClick={handlePasswordResetRequest}
                                disabled={submitting}
                            >
                                <Key size={20} />
                                {submitting ? 'جاري الإرسال...' : 'طلب تغيير كلمة المرور'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;