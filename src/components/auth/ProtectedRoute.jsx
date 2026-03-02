import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../../api/services/authConfig';

const ProtectedRoute = ({ requireSuperAdmin = false }) => {
    const location = useLocation();
    
    // 1. فحص هل المستخدم مسجل دخول؟
    const user = authService.getCurrentUser();

    // إذا لم يكن مسجلاً، توجيه لصفحة الدخول مع حفظ المكان
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. تطبيق نظام الـ RBAC (حماية مسارات SuperAdmin)
    const isSuperAdmin = user.role === 'SuperAdmin' || (user.roles && user.roles.includes('SuperAdmin'));
    
    if (requireSuperAdmin && !isSuperAdmin) {
        // إذا كانت الصفحة تتطلب مدير عام، والمستخدم الحالي ليس مديراً عاماً -> إرجاعه للرئيسية
        return <Navigate to="/admin" replace />;
    }

    // 3. إذا كان مسجلاً ويملك الصلاحية، اسمح له بالمرور
    return <Outlet />;
};

export default ProtectedRoute;