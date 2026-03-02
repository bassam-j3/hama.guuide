import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, Folder2Open } from 'react-bootstrap-icons';
import { fetchAllSections, deleteSection } from '../../api/services/sectionService'; 
import { getImageUrl } from '../../api/axiosConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast'; // 🚀 استيراد

const SectionsManagementPage = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const loadSections = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetchAllSections(); 
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res && Array.isArray(res.data)) data = res.data;
      else if (res && res.items && Array.isArray(res.items)) data = res.items;
      setSections(data);
    } catch (err) {
      setError('تعذر الاتصال بالسيرفر وجلب الأقسام.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`هل أنت متأكد من حذف قسم "${title}"؟`)) return;

    const toastId = toast.loading('جاري الحذف...'); // 🚀 إشعار التحميل
    try {
      setDeletingId(id);
      await deleteSection(id);
      setSections(prev => prev.filter(s => s.id !== id));
      toast.success(`تم حذف قسم "${title}" بنجاح!`, { id: toastId }); // 🚀 نجاح
    } catch (err) {
      toast.error('لا يمكن حذف القسم! قد يكون مرتبطاً بخدمات أخرى.', { id: toastId }); // 🚀 خطأ
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && sections.length === 0) return <LoadingSpinner message="جاري جلب الأقسام..." />;

  return (
    <div className="sections-page animate-fade-in text-end" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1 text-dark">إدارة الأقسام</h3>
          <p className="text-muted small mb-0">مشروع هما غايد - إدارة القطاعات الرئيسية</p>
        </div>
        <button className="btn btn-success d-flex align-items-center justify-content-center gap-2 px-4 shadow-sm w-100 w-md-auto" onClick={() => navigate('/admin/sections/create')}>
          <PlusLg /> إضافة قسم جديد
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadSections} inline={false} />}

      {!error && (
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
          <div className="card-body p-0">
            {sections.length === 0 ? (
              <div className="text-center py-5 px-3">
                <Folder2Open size={50} className="text-muted mb-3 opacity-25" />
                <p className="text-muted">لا توجد أقسام حالياً في قاعدة البيانات.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-secondary small text-uppercase">
                    <tr><th className="px-3 px-md-4 py-3" style={{ width: '80px' }}>الأيقونة</th><th className="py-3">القسم</th><th className="py-3 d-none d-lg-table-cell">الوصف</th><th className="py-3 text-center">الإجراءات</th></tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => (
                      <tr key={section.id} className={deletingId === section.id ? 'bg-light opacity-50' : ''}>
                        <td className="px-3 px-md-4">
                          <img src={section.imageUrl ? getImageUrl(section.imageUrl) : 'https://via.placeholder.com/45'} alt={section.title} className="rounded shadow-sm border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/45?text=No+Image'; }} />
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{section.title}</div>
                          <span className="badge bg-secondary-subtle text-secondary fw-normal mt-1" style={{ fontSize: '0.65rem' }}>{section.slug}</span>
                        </td>
                        <td className="d-none d-lg-table-cell"><span className="text-muted small text-truncate d-inline-block" style={{maxWidth: '250px'}}>{section.description || 'بدون وصف...'}</span></td>
                        <td className="text-center px-2 px-md-4">
                          <div className="d-flex justify-content-center gap-1 gap-md-2">
                            <button className="btn btn-outline-primary btn-sm border-0 px-2" onClick={() => navigate(`/admin/sections/edit/${section.id}`)}><PencilSquare size={16} /></button>
                            <button className="btn btn-outline-danger btn-sm border-0 px-2" disabled={deletingId === section.id} onClick={() => handleDelete(section.id, section.title)}>
                              {deletingId === section.id ? <span className="spinner-border spinner-border-sm"></span> : <Trash size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SectionsManagementPage;