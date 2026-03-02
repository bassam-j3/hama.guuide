import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.rtl.min.css'; // استيراد تنسيقات Bootstrap RTL

// Auth Components & Pages
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Admin Pages - Dashboard & Profile
import DashboardPage from './pages/admin/DashboardPage';
import ProfilePage from './pages/admin/ProfilePage'; // 🚀 إضافة صفحة الملف الشخصي

// Admin Pages - Users
import UsersManagementPage from './pages/admin/UsersManagementPage';

// Admin Pages - Sections
import SectionsManagementPage from './pages/admin/SectionsManagementPage';
import SectionCreatePage from './pages/admin/SectionCreatePage';
import SectionEditPage from './pages/admin/SectionEditPage';

// Admin Pages - Services & Schema
import ServicesManagementPage from './pages/admin/ServicesManagementPage';
import ServiceCreatePage from './pages/admin/ServiceCreatePage';
import ServiceEditPage from './pages/admin/ServiceEditPage';
import SchemaManager from './pages/admin/SchemaManager'; // 🚀 تعديل مسار السكيما ليتطابق مع الـ Sidebar

// Admin Pages - Posts (Content)
import PostServiceSelectionPage from './pages/admin/PostServiceSelectionPage';
import PostsManagementPage from './pages/admin/PostsManagementPage';
import PostCreatePage from './pages/admin/PostCreatePage'; 
import PostEditPage from './pages/admin/PostEditPage';

function App() {
  return (
    <Router>
      <Routes>

        {/* ✅ (1) المسارات العامة (Public Routes) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 🔐 (2) المسارات المحمية تحت تخطيط لوحة التحكم */}
        <Route path="/admin" element={<DashboardLayout />}>
            
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