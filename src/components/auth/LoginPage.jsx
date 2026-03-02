import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PersonCircle, Lock, BoxArrowInRight, Eye, EyeSlash } from 'react-bootstrap-icons';
import { authService } from '../../api/services/authConfig';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/admin'; 

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.login(userName, password);
            // في حال النجاح، توجيه للمكان المطلوب
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);
            setError('فشل تسجيل الدخول. تأكد من اسم المستخدم وكلمة المرور.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner message="جاري تسجيل الدخول..." fullPage />;

    return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-light" dir="rtl">
            <div className="card border-0 shadow-lg p-4 m-3 w-100" style={{ maxWidth: '400px' }}>
                <div className="text-center mb-4">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-3 mb-3">
                        <PersonCircle size={32} />
                    </div>
                    <h4 className="fw-bold">دليل حماة</h4>
                    <p className="text-muted small">سجل دخولك للوصول للوحة التحكم</p>
                </div>

                {error && <ErrorMessage message={error} />}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold">اسم المستخدم</label>
                        <input 
                            type="text" 
                            className="form-control form-control-lg fs-6" 
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required 
                            autoFocus
                        />
                    </div>
                    <div className="mb-4">
                        <label className="form-label small fw-bold">كلمة المرور</label>
                        <div className="input-group input-group-lg">
                            <span className="input-group-text bg-white text-muted border-end-0 px-3">
                                <Lock size={18} />
                            </span>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="form-control border-start-0 border-end-0 fs-6 ps-0" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            <button 
                                type="button" 
                                className="input-group-text bg-white text-muted border-start-0 cursor-pointer" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-2 py-md-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all hover-scale">
                        <BoxArrowInRight size={20} /> تسجيل الدخول
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;