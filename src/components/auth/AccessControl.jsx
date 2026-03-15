import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * مكون يغلف أي جزء من الواجهة (مثل زر حذف) ويخفيه إذا لم يمتلك المستخدم الصلاحية
 */
const AccessControl = ({ requireSuperAdmin = false, children }) => {
    const { isSuperAdmin } = useAuth();

    if (requireSuperAdmin && !isSuperAdmin) {
        return null; // لا ترندر شيء (إخفاء العنصر)
    }

    return <>{children}</>;
};

export default AccessControl;