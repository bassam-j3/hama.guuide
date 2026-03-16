import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PersonCircle, Lock, BoxArrowInRight, Eye, EyeSlash, Person } from 'react-bootstrap-icons';
import { authService } from '../../api/services/authConfig';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/admin'; 

    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!userName.trim() || !password.trim()) {
            return toast.error("يرجى إدخال اسم المستخدم وكلمة المرور.");
        }

        setLoading(true);

        try {
            await authService.login(userName, password);
            toast.success("تم تسجيل الدخول بنجاح! جاري التوجيه...");
            
            // تأخير بسيط لكي يرى المستخدم رسالة النجاح
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 800);

        } catch (err) {
            console.error(err);
            // 🚀 قراءة الخطأ القادم من الباك-إند بذكاء
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

    return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-light" dir="rtl">
            <div className="card border-0 shadow-lg p-4 p-md-5 m-3 w-100 rounded-4" style={{ maxWidth: '450px' }}>
                <div className="text-center mb-5">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-4 mb-3 shadow-sm">
                        <PersonCircle size={40} />
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
                        <label className="form-label small fw-bold text-secondary">كلمة المرور</label>
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
        </div>
    );
};

export default LoginPage;