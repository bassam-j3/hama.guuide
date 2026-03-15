import React from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'; // 🚀 استيراد useOutletContext
import { authService } from '../../api/services/authConfig';

const ProtectedRoute = ({ requireSuperAdmin = false }) => {
    const location = useLocation();
    
    // 🚀 استلام السياق من الـ Layout الأب (DashboardLayout)
    const context = useOutletContext(); 
    
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

    // 3. 🚀 تمرير السياق إلى الصفحات الداخلية لكي لا تنهار!
    return <Outlet context={context} />; 
};

export default ProtectedRoute;