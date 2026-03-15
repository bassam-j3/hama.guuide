import React, { lazy } from 'react'; // 🚀 لاحظ: أزلنا Suspense من هنا
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // 🚀 أزلنا Outlet من هنا
import 'bootstrap/dist/css/bootstrap.rtl.min.css'; 

import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';

// الصفحات (Lazy Loading)
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

function App() {
  return (
    <Router>
      <Routes>

        {/* المسارات العامة */}
        <Route path="/login" element={<LoginPage />} />

        {/* المسارات المحمية (تخطيط لوحة التحكم) */}
        <Route path="/admin" element={<DashboardLayout />}>
            
            {/* 🚀 تم إزالة ErrorBoundary و Suspense من هنا لأنهم أصبحوا داخل DashboardLayout */}
            
            {/* مسارات Admin (مسموحة للجميع) */}
            <Route element={<ProtectedRoute />}>
                <Route index element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="posts" element={<PostServiceSelectionPage />} />
                <Route path="posts/:serviceSlug" element={<PostsManagementPage />} />
                <Route path="services/:serviceSlug/posts/create" element={<PostCreatePage />} />
                <Route path="services/:serviceSlug/posts/edit/:postId" element={<PostEditPage />} />
            </Route>

            {/* مسارات SuperAdmin (محمية للإدارة العليا فقط) */}
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

        {/* التوجيه الافتراضي للرئيسية */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* صفحة 404 للأخطاء */}
        <Route path="*" element={
            <div className="d-flex vh-100 align-items-center justify-content-center text-center bg-light">
                <div>
                    <h1 className="display-1 fw-bold text-secondary">404</h1>
                    <p className="lead text-muted mb-4">الصفحة التي تبحث عنها غير موجودة أو لا تملك صلاحية للوصول إليها.</p>
                    <button onClick={() => window.location.href = '/admin'} className="btn btn-primary px-4 py-2 fw-bold shadow-sm">
                        العودة للرئيسية
                    </button>
                </div>
            </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;