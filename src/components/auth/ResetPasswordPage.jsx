import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldLock, Key, CheckCircle, EyeSlash, Eye } from 'react-bootstrap-icons';
import { authService } from '../../api/services/authConfig';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // استخراج الإيميل والكود من الرابط (الذي سيأتي في الإيميل)
    const email = searchParams.get('email') || searchParams.get('Email');
    const code = searchParams.get('code') || searchParams.get('ResetCode');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // إذا تم الدخول للصفحة بدون رابط صحيح
    if (!email || !code) {
        return (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-light" dir="rtl">
                <div className="text-center card border-0 shadow-sm p-5 rounded-4">
                    <ShieldLock size={50} className="text-danger mb-3" />
                    <h4 className="fw-bold text-dark mb-2">رابط غير صالح</h4>
                    <p className="text-muted">الرابط الذي تحاول الوصول إليه غير مكتمل أو منتهي الصلاحية.</p>
                    <button className="btn btn-primary mt-3 px-4" onClick={() => navigate('/login')}>العودة لتسجيل الدخول</button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return toast.error("كلمتا المرور غير متطابقتين!");
        }

        setLoading(true);
        try {
            await authService.resetPassword(email, code, newPassword);
            toast.success("تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.");
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 1500);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "فشل تغيير كلمة المرور. قد يكون الرابط منتهي الصلاحية.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-light" dir="rtl">
            <div className="card border-0 shadow-lg p-4 p-md-5 m-3 w-100 rounded-4" style={{ maxWidth: '450px' }}>
                <div className="text-center mb-4">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-4 mb-3 shadow-sm">
                        <Key size={40} />
                    </div>
                    <h3 className="fw-bold text-dark mb-1">كلمة مرور جديدة</h3>
                    <p className="text-muted small">أدخل كلمة المرور الجديدة لحسابك<br/><strong dir="ltr">{email}</strong></p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">كلمة المرور الجديدة</label>
                        <div className="input-group shadow-sm">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="form-control fs-6" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="أدخل كلمة المرور الجديدة"
                                required 
                                pattern=".*[^a-zA-Z0-9].*" 
                                title="يجب أن تحتوي كلمة المرور على حرف خاص واحد على الأقل (مثل @, #, $, !)"
                                disabled={loading}
                            />
                            <button 
                                type="button" 
                                className="input-group-text bg-white text-muted cursor-pointer" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeSlash /> : <Eye />}
                            </button>
                        </div>
                        <div className="form-text small opacity-75">يجب أن تحتوي على حروف، أرقام، وحرف خاص واحد.</div>
                    </div>
                    
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-secondary">تأكيد كلمة المرور</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            className="form-control fs-6 shadow-sm" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="أعد إدخال كلمة المرور"
                            required 
                            disabled={loading}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="btn btn-success w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3 shadow"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner-border spinner-border-sm" /> : <CheckCircle size={20} />}
                        {loading ? 'جاري الحفظ...' : 'تأكيد كلمة المرور'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;