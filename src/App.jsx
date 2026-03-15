import React, { Suspense, lazy } from 'react'; // 🚀 1. استيراد Suspense و lazy
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'; // 🚀 2. استيراد Outlet
import 'bootstrap/dist/css/bootstrap.rtl.min.css'; // استيراد تنسيقات Bootstrap RTL

// Auth Components & Layout (يتم تحميلها فوراً لأنها تظهر للمستخدم أولاً)
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner'; // 🚀 استيراد مؤشر التحميل

// 🚀 3. تحويل جميع الصفحات إلى التحميل البطيء (Lazy Loading) لزيادة سرعة الموقع
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/admin/ProfilePage'));

// Admin Pages - Users
const UsersManagementPage = lazy(() => import('./pages/admin/UsersManagementPage'));

// Admin Pages - Sections
const SectionsManagementPage = lazy(() => import('./pages/admin/SectionsManagementPage'));
const SectionCreatePage = lazy(() => import('./pages/admin/SectionCreatePage'));
const SectionEditPage = lazy(() => import('./pages/admin/SectionEditPage'));

// Admin Pages - Services & Schema
const ServicesManagementPage = lazy(() => import('./pages/admin/ServicesManagementPage'));
const ServiceCreatePage = lazy(() => import('./pages/admin/ServiceCreatePage'));
const ServiceEditPage = lazy(() => import('./pages/admin/ServiceEditPage'));
const SchemaManager = lazy(() => import('./pages/admin/SchemaManager'));

// Admin Pages - Posts (Content)
const PostServiceSelectionPage = lazy(() => import('./pages/admin/PostServiceSelectionPage'));
const PostsManagementPage = lazy(() => import('./pages/admin/PostsManagementPage'));
const PostCreatePage = lazy(() => import('./pages/admin/PostCreatePage')); 
const PostEditPage = lazy(() => import('./pages/admin/PostEditPage'));

function App() {
  return (
    <Router>
      <Routes>

        {/* ✅ (1) المسارات العامة (Public Routes) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 🔐 (2) المسارات المحمية تحت تخطيط لوحة التحكم */}
        <Route path="/admin" element={<DashboardLayout />}>
            
            {/* 🚀 4. تغليف المسارات الداخلية بـ Suspense لكي يظهر المؤشر أثناء تحميل كود الصفحة المعينة */}
            <Route element={
              <Suspense fallback={
                <div className="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '60vh' }}>
                  <LoadingSpinner message="جاري تحميل الصفحة..." />
                </div>
              }>
                <Outlet />
              </Suspense>
            }>
                
                {/* 🟢 مسارات مستوى (Admin) - مسموحة للجميع */}
                <Route element={<ProtectedRoute />}>
                    {/* الرئيسية والملف الشخصي */}
                    <Route index element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />

                    {/* إدارة المنشورات (المحتوى) */}
                    <Route path="posts" element={<PostServiceSelectionPage />} />
                    <Route path="posts/:serviceSlug" element={<PostsManagementPage />} />
                    <Route path="services/:serviceSlug/posts/create" element={<PostCreatePage />} />
                    <Route path="services/:serviceSlug/posts/edit/:postId" element={<PostEditPage />} />
                </Route>

                {/* 🔴 مسارات مستوى (SuperAdmin) - محمية للإدارة العليا فقط */}
                <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
                    {/* إدارة المستخدمين */}
                    <Route path="users" element={<UsersManagementPage />} />
                    
                    {/* إدارة الأقسام */}
                    <Route path="sections" element={<SectionsManagementPage />} />
                    <Route path="sections/create" element={<SectionCreatePage />} />
                    <Route path="sections/edit/:id" element={<SectionEditPage />} />
                    
                    {/* إدارة الخدمات */}
                    <Route path="services" element={<ServicesManagementPage />} />
                    <Route path="services/create" element={<ServiceCreatePage />} />
                    <Route path="services/edit/:id" element={<ServiceEditPage />} />
                    
                    {/* إدارة المخططات */}
                    <Route path="schema" element={<SchemaManager />} />
                </Route>

            </Route> {/* نهاية الـ Suspense Route */}

        </Route>

        {/* 🔄 التوجيه الافتراضي للرئيسية */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        {/* ❌ صفحة 404 للأخطاء */}
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