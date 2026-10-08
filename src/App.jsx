import React, { lazy, useEffect, Suspense } from 'react'; 
import { createBrowserRouter, RouterProvider, Navigate, Link, useNavigate, Outlet } from 'react-router-dom'; 
import 'bootstrap/dist/css/bootstrap.rtl.min.css'; 

import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import { authEvents } from './utils/authEvents';

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/admin/ProfilePage'));
const UsersManagementPage = lazy(() => import('./pages/admin/UsersManagementPage'));
const SectionsManagementPage = lazy(() => import('./pages/admin/SectionsManagementPage'));
const SectionCreatePage = lazy(() => import('./pages/admin/SectionCreatePage'));
const SectionEditPage = lazy(() => import('./pages/admin/SectionEditPage'));
const ServicesManagementPage = lazy(() => import('./pages/admin/ServicesManagementPage'));
const ServiceCreatePage = lazy(() => import('./pages/admin/ServiceCreatePage'));
const ServiceEditPage = lazy(() => import('./pages/admin/ServiceEditPage'));
const SchemaManager = lazy(() => import('./pages/admin/SchemaManager'));
const PostServiceSelectionPage = lazy(() => import('./pages/admin/PostServiceSelectionPage'));
const PostsManagementPage = lazy(() => import('./pages/admin/PostsManagementPage'));
const PostCreatePage = lazy(() => import('./pages/admin/PostCreatePage')); 
const PostEditPage = lazy(() => import('./pages/admin/PostEditPage'));

const NotFoundPage = () => (
    <div className="d-flex vh-100 align-items-center justify-content-center text-center bg-light animate-fade-in">
        <div>
            <h1 className="display-1 fw-bold text-secondary">404</h1>
            <p className="lead text-muted mb-4">الصفحة التي تبحث عنها غير موجودة أو لا تملك صلاحية للوصول إليها.</p>
            <Link to="/admin" className="btn btn-primary px-4 py-2 fw-bold shadow-sm">
                العودة للرئيسية
            </Link>
        </div>
    </div>
);

// 🚀 Component to catch Axios interceptor events inside the Router context
const AuthEventHandler = () => {
    const navigate = useNavigate();
    
    useEffect(() => {
        const unsubscribe = authEvents.on('logout', () => {
            navigate('/login', { replace: true });
        });
        
        return () => unsubscribe();
    }, [navigate]);

    return null; 
};

// Root layout to hold the AuthEventHandler inside the router context
const RootLayout = () => (
    <>
        <AuthEventHandler />
        <Suspense fallback={
            <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
                <LoadingSpinner message="جاري التحميل..." />
            </div>
        }>
            <Outlet />
        </Suspense>
    </>
);


const router = createBrowserRouter([
    {
        element: <RootLayout />,
        errorElement: <ErrorBoundary />,
        children: [
            { path: "/login", element: <LoginPage /> },
            { path: "/reset-password", element: <ResetPasswordPage /> },
            {
                path: "/admin",
                element: <DashboardLayout />,
                errorElement: <ErrorBoundary />,
                children: [
                    {
                        element: <ProtectedRoute />,
                        children: [
                            { index: true, element: <DashboardPage /> },
                            { path: "profile", element: <ProfilePage /> },
                            { path: "posts", element: <PostServiceSelectionPage /> },
                            { path: "posts/:serviceSlug", element: <PostsManagementPage /> },
                            { path: "services/:serviceSlug/posts/create", element: <PostCreatePage /> },
                            { path: "services/:serviceSlug/posts/edit/:postId", element: <PostEditPage /> }
                        ]
                    },
                    {
                        element: <ProtectedRoute requireSuperAdmin={true} />,
                        children: [
                            { path: "users", element: <UsersManagementPage /> },
                            { path: "sections", element: <SectionsManagementPage /> },
                            { path: "sections/create", element: <SectionCreatePage /> },
                            { path: "sections/edit/:id", element: <SectionEditPage /> },
                            { path: "services", element: <ServicesManagementPage /> },
                            { path: "services/create", element: <ServiceCreatePage /> },
                            { path: "services/edit/:id", element: <ServiceEditPage /> },
                            { path: "schema", element: <SchemaManager /> }
                        ]
                    }
                ]
            },
            { path: "/", element: <Navigate to="/admin" replace /> },
            { path: "*", element: <NotFoundPage /> }
        ]
    }
]);


function App() {
  return <RouterProvider router={router} />;
}

export default App;