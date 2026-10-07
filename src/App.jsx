import React, { lazy, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'; 
import 'bootstrap/dist/css/bootstrap.rtl.min.css'; 

import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
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

function App() {
  return (
    <Router>
      <AuthEventHandler />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/admin" element={<DashboardLayout />}>
            <Route element={<ProtectedRoute />}>
                <Route index element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="posts" element={<PostServiceSelectionPage />} />
                <Route path="posts/:serviceSlug" element={<PostsManagementPage />} />
                <Route path="services/:serviceSlug/posts/create" element={<PostCreatePage />} />
                <Route path="services/:serviceSlug/posts/edit/:postId" element={<PostEditPage />} />
            </Route>

            <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
                <Route path="users" element={<UsersManagementPage />} />
                <Route path="sections" element={<SectionsManagementPage />} />
                <Route path="sections/create" element={<SectionCreatePage />} />
                <Route path="sections/edit/:id" element={<SectionEditPage />} />
                <Route path="services" element={<ServicesManagementPage />} />
                <Route path="services/create" element={<ServiceCreatePage />} />
                <Route path="services/edit/:id" element={<ServiceEditPage />} />
                <Route path="schema" element={<SchemaManager />} />
            </Route>
        </Route>

        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<NotFoundPage />} />
        
      </Routes>
    </Router>
  );
}

export default App;