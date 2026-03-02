import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Gear, FileText, PlusCircle, Activity, People } from 'react-bootstrap-icons';
import { fetchAllSections } from '../../api/services/sectionService'; 
import { fetchAllServices } from '../../api/services/serviceService'; 
import { fetchAllAll } from '../../api/services/postService'; // 🚀 تم التصحيح هنا (Named Import)
import { authService } from '../../api/services/authConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSections: 0, totalServices: 0, totalPosts: 0 });
  const [loading, setLoading] = useState(true);

  // جلب المستخدم من المصدر الموحد (Single Source of Truth)
  const currentUser = authService.getCurrentUser();
  const username = currentUser?.username || 'مدير النظام';
  const isSuperAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.roles?.includes('SuperAdmin');

  const loadRealTimeStats = useCallback(async () => {
    try {
      setLoading(true);
      const [sections, services, posts] = await Promise.all([
        fetchAllSections().catch(() => []),       
        fetchAllServices().catch(() => []),    
        fetchAllAll().catch(() => []) // 🚀 تم التصحيح هنا لاستخدام الدالة مباشرة
      ]);
      setStats({
        totalSections: sections?.length || 0,
        totalServices: services?.length || 0,
        totalPosts: posts?.length || 0,
      });
    } catch (err) {
      console.error('Dashboard Engine Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRealTimeStats(); }, [loadRealTimeStats]);

  if (loading) return <LoadingSpinner message="جاري تحليل بيانات النظام..." />;

  return (
    <div className="dashboard-wrapper animate-fade-in text-end" dir="rtl">
      <div className="d-flex justify-content-between align-items-md-center flex-column flex-md-row mb-4 mb-md-5 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">أهلاً بك، {username} 👋</h2>
          <p className="text-muted mb-0">إليك ما يحدث في "دليل حماة" اليوم.</p>
        </div>
        <div className="bg-white p-3 rounded-4 shadow-sm d-flex align-items-center justify-content-between gap-3 w-100 w-md-auto">
          <div className="text-start">
            <small className="text-muted d-block">الحالة</small>
            <span className="badge bg-success-subtle text-success px-3">متصل بالسيرفر</span>
          </div>
          <Activity size={24} className="text-success" />
        </div>
      </div>

      <div className="row g-3 g-md-4">
        <StatCard title="الأقسام" count={stats.totalSections} icon={<Grid size={24} />} color="#198754" onClick={() => navigate('/admin/sections')} />
        <StatCard title="الخدمات" count={stats.totalServices} icon={<Gear size={24} />} color="#0d6efd" onClick={() => navigate('/admin/services')} />
        <StatCard title="المنشورات" count={stats.totalPosts} icon={<FileText size={24} />} color="#dc3545" onClick={() => navigate('/admin/posts')} />
      </div>

      {/* إخفاء الأزرار والإعدادات الحساسة عن المدير العادي */}
      {isSuperAdmin && (
        <div className="row mt-4 mt-md-5 g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-3 p-md-4 text-center">
                <h5 className="fw-bold mb-4">إجراءات سريعة</h5>
                <div className="d-grid gap-3 d-md-flex justify-content-center">
                  <button onClick={() => navigate('/admin/sections/create')} className="btn btn-outline-success border-2 px-4 py-2 py-md-3 rounded-3">
                    <PlusCircle className="ms-2" /> إضافة قسم جديد
                  </button>
                  <button onClick={() => navigate('/admin/services/create')} className="btn btn-outline-primary border-2 px-4 py-2 py-md-3 rounded-3">
                    <Gear className="ms-2" /> إضافة خدمة جديدة
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 bg-dark text-white h-100 p-3 p-md-4 text-center">
              <People size={40} className="text-success mb-3 mx-auto" />
              <h6>دعم النظام</h6>
              <p className="small text-white-50 mb-0">أنت تمتلك صلاحيات الإدارة العليا للتحكم بكامل النظام والهيكلة.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, count, icon, color, onClick }) => (
  <div className="col-12 col-sm-6 col-md-4">
    <div className="card border-0 shadow-sm rounded-4 h-100 cursor-pointer stat-card-hover" onClick={onClick}>
      <div className="card-body p-3 p-md-4 text-center">
        <div className="mx-auto p-3 rounded-3 mb-3" style={{ backgroundColor: `${color}10`, color: color, width: 'fit-content' }}>
          {icon}
        </div>
        <h2 className="fw-bold mb-1" style={{ fontSize: '2.5rem' }}>{count}</h2>
        <span className="text-muted fw-bold">{title}</span>
      </div>
    </div>
  </div>
);

export default DashboardPage;