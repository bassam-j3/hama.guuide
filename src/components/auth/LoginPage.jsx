import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PersonCircle, Lock, BoxArrowInRight, Eye, EyeSlash, Person, Key } from 'react-bootstrap-icons';
import { Modal, Button, Form } from 'react-bootstrap';
import { authService } from '../../api/services/authConfig';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import logo from '../../assets/logo.svg';
const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/admin'; 

    // حالة الفورم الأساسي
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // حالة نافذة "نسيت كلمة المرور"
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!userName.trim() || !password.trim()) {
            return toast.error("يرجى إدخال اسم المستخدم وكلمة المرور.");
        }

        setLoading(true);

        try {
            await authService.login(userName, password);
            toast.success("تم تسجيل الدخول بنجاح! جاري التوجيه...");
            
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 800);

        } catch (err) {
            console.error(err);
            let errorMsg = 'فشل تسجيل الدخول. تأكد من صحة بياناتك.';
            if (err.response?.data?.detail) {
                errorMsg = err.response.data.detail;
            } else if (err.response?.status === 401 || err.response?.status === 404) {
                errorMsg = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
            }
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 React Query Mutation لطلب إعادة التعيين
    const resetPasswordMutation = useMutation({
        mutationFn: (email) => authService.requestPasswordReset(email),
        onSuccess: () => {
            toast.success("إذا كان الإيميل مسجلاً، ستصلك رسالة بكلمة المرور الجديدة.");
            setShowResetModal(false);
            setResetEmail('');
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.detail || "حدث خطأ أثناء إرسال الطلب. حاول لاحقاً.";
            toast.error(errorMsg);
        }
    });

    const handleResetSubmit = (e) => {
        e.preventDefault();
        if (!resetEmail.trim()) return toast.error("يرجى إدخال بريدك الإلكتروني.");
        resetPasswordMutation.mutate(resetEmail);
    };

    return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-light" dir="rtl">
            <div className="card border-0 shadow-lg p-4 p-md-5 m-3 w-100 rounded-4" style={{ maxWidth: '450px' }}>
                <div className="text-center mb-5">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3 shadow-sm align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                        <img src={logo} alt="شعار دليل حماة" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    </div>
                    <h3 className="fw-bold text-dark mb-1">دليل حماة</h3>
                    <p className="text-muted small">سجل دخولك للوصول للوحة التحكم الآمنة</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-secondary">اسم المستخدم</label>
                        <div className="input-group input-group-lg shadow-sm">
                            <span className="input-group-text bg-white text-primary border-end-0 px-3">
                                <Person size={20} />
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-start-0 fs-6 ps-0" 
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="أدخل اسم المستخدم"
                                required 
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <div className="mb-5">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label small fw-bold text-secondary mb-0">كلمة المرور</label>
                            {/* 🚀 رابط "نسيت كلمة المرور" */}
                            <button 
                                type="button" 
                                className="btn btn-link p-0 text-decoration-none small text-primary"
                                onClick={() => setShowResetModal(true)}
                                disabled={loading}
                            >
                                نسيت كلمة المرور؟
                            </button>
                        </div>
                        <div className="input-group input-group-lg shadow-sm">
                            <span className="input-group-text bg-white text-primary border-end-0 px-3">
                                <Lock size={20} />
                            </span>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="form-control border-start-0 border-end-0 fs-6 ps-0" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="أدخل كلمة المرور"
                                required 
                                disabled={loading}
                            />
                            <button 
                                type="button" 
                                className="input-group-text bg-white text-muted border-start-0 cursor-pointer" 
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                            <BoxArrowInRight size={22} />
                        )}
                        {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>

            {/* 🚀 نافذة (Modal) استرجاع كلمة المرور */}
            <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered dir="rtl">
                <Form onSubmit={handleResetSubmit}>
                    <Modal.Header className="border-0 pb-0">
                        <button type="button" className="btn-close ms-0 me-auto" onClick={() => setShowResetModal(false)}></button>
                    </Modal.Header>
                    <Modal.Body className="text-center pt-0 px-4 px-md-5">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-3 mb-3 shadow-sm">
                            <Key size={32} />
                        </div>
                        <h4 className="fw-bold mb-2">نسيت كلمة المرور؟</h4>
                        <p className="text-muted small mb-4">
                            أدخل بريدك الإلكتروني المسجل لدينا، وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                        </p>
                        
                        <Form.Group className="text-start">
                            <Form.Label className="small fw-bold text-secondary">البريد الإلكتروني</Form.Label>
                            <Form.Control 
                                type="email" 
                                placeholder="name@example.com" 
                                value={resetEmail} 
                                onChange={(e) => setResetEmail(e.target.value)} 
                                required 
                                dir="ltr"
                                className="form-control-lg fs-6 shadow-sm"
                                disabled={resetPasswordMutation.isPending}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0 px-4 px-md-5 pb-4 d-flex gap-2">
                        <Button variant="light" className="border w-100 m-0" onClick={() => setShowResetModal(false)} disabled={resetPasswordMutation.isPending}>
                            إلغاء
                        </Button>
                        <Button variant="primary" type="submit" className="w-100 m-0 fw-bold shadow-sm" disabled={resetPasswordMutation.isPending}>
                            {resetPasswordMutation.isPending ? <span className="spinner-border spinner-border-sm" /> : "إرسال الرابط"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default LoginPage;