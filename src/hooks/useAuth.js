import { useState } from 'react';
import { authService } from '../api/services/authConfig';

/**
 * Custom Hook لإدارة وقراءة صلاحيات المستخدم الحالي
 */
export const useAuth = () => {
    const [user] = useState(() => authService.getCurrentUser());

    let isSuperAdmin = false;
    let isAdmin = false;

    if (user) {
        const role = user.role || user.Role;
        const roles = user.roles || user.Roles || [];

        isSuperAdmin = role === 'SuperAdmin' || roles.includes('SuperAdmin');
        isAdmin = role === 'Admin' || roles.includes('Admin') || isSuperAdmin;
    }

    return { user, isSuperAdmin, isAdmin };
};