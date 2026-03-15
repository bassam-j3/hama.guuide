import { useState, useEffect } from 'react';
import { authService } from '../api/services/authConfig'; // 🚀 1. استيراد authService بدلاً من getUser

/**
 * Custom Hook لإدارة وقراءة صلاحيات المستخدم الحالي
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // 🚀 2. استخدام الدالة الصحيحة من authService
        const currentUser = authService.getCurrentUser(); 
        
        if (currentUser) {
            setUser(currentUser);
            
            // قراءة الصلاحيات بناءً على الـ Role
            const role = currentUser.role || currentUser.Role;
            const roles = currentUser.roles || currentUser.Roles || [];

            const isSuper = role === 'SuperAdmin' || roles.includes('SuperAdmin');
            const isAdm = role === 'Admin' || roles.includes('Admin') || isSuper;

            setIsSuperAdmin(isSuper);
            setIsAdmin(isAdm);
        }
    }, []);

    return { user, isSuperAdmin, isAdmin };
};