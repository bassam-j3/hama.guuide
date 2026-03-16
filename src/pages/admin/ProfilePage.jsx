import React, { useState } from 'react';
import { PersonBadge, Envelope, ShieldLock, Key, InputCursorText } from 'react-bootstrap-icons';
import { Modal, Button, Form } from 'react-bootstrap';
import authService from '../../api/services/authConfig';
import axiosInstance from '../../api/axiosConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';

// 🚀 أداة الـ Toast المخصصة
import { confirmAction } from '../../utils/alerts';

const ProfilePage = () => {
    // حالة نافذة تغيير الإيميل
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    // 🚀 1. جلب بيانات المدير الحالي باستخدام React Query
    const { data: user, isLoading, isError } = useQuery({
        queryKey: ['profile-me'],
        queryFn: async () => {
            try {
                return await authService.getMe(); // جلب البيانات الطازجة من السيرفر
            } catch (err) {
                return authService.getCurrentUser(); // احتياطي من الـ LocalStorage
            }
        },
        staleTime: 5 * 60 * 1000, // الاحتفاظ بالبيانات لمدة 5 دقائق قبل إعادة جلبها
    });

    // 🚀 2. طلب إعادة تعيين كلمة المرور
    const passwordResetMutation = useMutation({
        mutationFn: (email) => authService.requestPasswordReset(email),
        onSuccess: () => toast.success("تم إرسال تعليمات تغيير كلمة المرور لبريدك!"),
        onError: () => toast.error("فشل في إرسال الطلب. حاول مجدداً.")
    });

    // 🚀 3. تغيير البريد الإلكتروني (بناءً على مسارات Swagger)
    const emailChangeMutation = useMutation({
        mutationFn: (email) => axiosInstance.post('/auth/email/change', { newEmail: email }),
        onSuccess: () => {
            toast.success("تم إرسال رابط تأكيد إلى بريدك الجديد!");
            setShowEmailModal(false);
            setNewEmail('');
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.detail || "فشل طلب تغيير البريد الإلكتروني.";
            toast.error(errorMsg);
        }
    });

    // معالج زر تغيير كلمة المرور
    const handlePasswordResetClick = () => {
        if (!user?.email) return toast.error("لا يوجد بريد إلكتروني مرتبط بحسابك.");
        
        // 🚀 استخدام Toast الأنيق بدلاً من window.confirm
        confirmAction(
            "هل تريد إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني؟", 
            () => passwordResetMutation.mutate(user.email)
        );
    };

    // معالج إرسال نموذج تغيير الإيميل
    const handleEmailChangeSubmit = (e) => {
        e.preventDefault();
        if (!newEmail || newEmail === user?.email) {
            return toast.error("يرجى إدخال بريد إلكتروني جديد مختلف.");
        }
        emailChangeMutation.mutate(newEmail);
    };

    if (isLoading) return <LoadingSpinner message="جاري جلب الملف الشخصي..." />;
    if (isError) return <ErrorMessage message="فشل في جلب بيانات الملف الشخصي." />;

    return (
        <div className="profile-page animate-fade-in text-end" dir="rtl">
            <h3 className="fw-bold mb-4 text-dark">الملف الشخصي</h3>
            
            <div className="row g-4">
                {/* بطاقة معلومات المستخدم */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4 text-center">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-4 mb-3">
                                <PersonBadge size={64} />
                            </div>
                            <h4 className="fw-bold mb-1">{user?.username || 'مدير النظام'}</h4>
                            <p className="text-muted d-flex align-items-center justify-content-center gap-2 mb-4">
                                <Envelope /> <span dir="ltr">{user?.email || 'لا يوجد بريد إلكتروني'}</span>
                            </p>
                            <span className="badge bg-dark px-4 py-2" style={{fontSize: '0.9rem'}}>
                                الدور: {user?.role || (user?.roles && user.roles[0]) || 'Admin'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* بطاقة إعدادات الأمان */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-4 border-bottom pb-3"><ShieldLock className="me-2 text-danger"/> الأمان وإعدادات الحساب</h5>
                            
                            {/* تغيير كلمة المرور */}
                            <div className="mb-4">
                                <p className="text-muted small mb-3">
                                    سيتم إرسال رابط آمن إلى بريدك الإلكتروني المسجل لدينا لتتمكن من اختيار كلمة مرور جديدة.
                                </p>
                                <button 
                                    className="btn btn-outline-danger w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                    onClick={handlePasswordResetClick}
                                    disabled={passwordResetMutation.isPending}
                                >
                                    {passwordResetMutation.isPending ? <span className="spinner-border spinner-border-sm" /> : <Key size={20} />}
                                    {passwordResetMutation.isPending ? 'جاري الإرسال...' : 'طلب تغيير كلمة المرور'}
                                </button>
                            </div>

                            <hr className="text-muted opacity-25" />

                            {/* تغيير الإيميل */}
                            <div>
                                <p className="text-muted small mb-3">
                                    هل ترغب في تغيير البريد الإلكتروني المرتبط بحسابك؟
                                </p>
                                <button 
                                    className="btn btn-outline-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                                    onClick={() => setShowEmailModal(true)}
                                >
                                    <InputCursorText size={20} />
                                    تغيير البريد الإلكتروني
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* نافذة تغيير الإيميل (Modal) */}
            <Modal show={showEmailModal} onHide={() => setShowEmailModal(false)} centered dir="rtl">
                <Form onSubmit={handleEmailChangeSubmit}>
                    <Modal.Header>
                        <Modal.Title className="fw-bold fs-5">تغيير البريد الإلكتروني</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p className="small text-muted mb-3">سيتم إرسال رسالة تأكيد إلى بريدك الجديد لتفعيله.</p>
                        <Form.Group>
                            <Form.Label className="small fw-bold">البريد الإلكتروني الجديد</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="name@example.com" 
                                value={newEmail} 
                                onChange={e => setNewEmail(e.target.value)} 
                                required 
                                dir="ltr"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 bg-light">
                        <Button variant="light" className="border" onClick={() => setShowEmailModal(false)}>إلغاء</Button>
                        <Button variant="primary" type="submit" disabled={emailChangeMutation.isPending}>
                            {emailChangeMutation.isPending ? "جاري الإرسال..." : "إرسال رابط التفعيل"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default ProfilePage;