import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export const useUnsavedChangesGuard = (isDirty) => {
    // 🚀 React Router Block SPA Navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === 'blocked') {
            const confirmLeave = window.confirm('لديك تغييرات غير محفوظة. هل أنت متأكد من مغادرة الصفحة؟');
            if (confirmLeave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    // 🚀 Block Tab Close or Reload
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);
};
