import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import { Toaster } from 'react-hot-toast';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 🚀 1. إنشاء State للتحكم في التحديث الشامل
  const [globalRefreshKey, setGlobalRefreshKey] = useState(0);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // 🚀 2. الدالة السحرية التي ستجبر لوحة التحكم على التحديث
  const triggerGlobalRefresh = useCallback(() => {
    setGlobalRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    <div className="dashboard-wrapper" dir="rtl">
      {/* الإشعارات تبقى خارج المفتاح لكي لا تختفي فجأة عند التحديث */}
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'inherit', fontWeight: 'bold', padding: '12px 20px' }
        }} 
      />

      <style>{`
        .sidebar-wrapper { position: fixed; right: 0; top: 0; width: 280px; height: 100vh; z-index: 1050; transition: transform 0.3s ease-in-out; }
        .main-wrapper { transition: margin-right 0.3s ease-in-out; min-height: 100vh; display: flex; flex-direction: column; }
        .sidebar-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 1040; opacity: 0; visibility: hidden; transition: 0.3s; }
        
        @media (max-width: 991.98px) {
          .sidebar-wrapper { transform: translateX(100%); } 
          .sidebar-wrapper.open { transform: translateX(0); } 
          .main-wrapper { margin-right: 0 !important; }
          .sidebar-overlay.open { opacity: 1; visibility: visible; }
        }
        @media (min-width: 992px) {
          .sidebar-wrapper { transform: translateX(0); }
          .main-wrapper { margin-right: 280px; }
        }
      `}</style>

      <div className={`sidebar-overlay d-lg-none ${isSidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>

      {/* 🚀 3. ربط المفتاح بالـ Sidebar لتتحدث إذا كان بها إحصائيات */}
      <aside className={`sidebar-wrapper bg-dark ${isSidebarOpen ? 'open' : ''}`} key={`sidebar-${globalRefreshKey}`}>
        <Sidebar closeSidebar={closeSidebar} />
      </aside>

      <div className="main-wrapper bg-light">
        {/* 🚀 4. ربط المفتاح بالـ Navbar للتحديث */}
        <header className="sticky-top bg-white shadow-sm" style={{ zIndex: 1020 }} key={`nav-${globalRefreshKey}`}>
          <Navbar toggleSidebar={toggleSidebar} />
        </header>

        {/* 🚀 5. ربط المفتاح بالـ Main يجبر الصفحة المعروضة على إعادة عمل (Mount) وجلب البيانات من جديد */}
        <main className="p-3 p-md-4 flex-grow-1" key={`main-${globalRefreshKey}`}>
          <div className="container-fluid p-0">
            {/* 🚀 6. نمرر الدالة كـ Context لجميع الصفحات الداخلية لتستطيع مناداتها */}
            <Outlet context={{ triggerGlobalRefresh }} /> 
          </div>
        </main>

        <footer className="py-3 px-4 bg-white border-top text-muted small text-center">
          &copy; {new Date().getFullYear()} HamaGuide Admin Panel
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;