import { useState, useEffect } from 'react';
import { getUser } from '../api/services/authConfig';

/**
 * Custom Hook لإدارة وقراءة صلاحيات المستخدم الحالي
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const currentUser = getUser();
        if (currentUser) {
            setUser(currentUser);
            
            // قراءة الصلاحيات بناءً على الـ Role
            // الباك إند قد يرسل role كـ String أو مصفوفة من الـ roles
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