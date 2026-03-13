import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, Folder2Open, ArrowsMove, ArrowUpCircle } from 'react-bootstrap-icons';
import { fetchAllSections, deleteSection, assignChildSection, removeChildSection } from '../../api/services/sectionService'; 
import { getImageUrl } from '../../api/axiosConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast';

const SectionsManagementPage = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  // 🚀 حالات السحب والإفلات
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [updatingHierarchy, setUpdatingHierarchy] = useState(false);

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

  // 🚀 بناء شجرة الأقسام ليتم عرضها بمسافات بادئة
  const hierarchicalSections = useMemo(() => {
    const buildHierarchy = (sectionsList, parentId = null, level = 0) => {
        let result = [];
        const children = sectionsList.filter(s => s.parentId === parentId);
        for (const child of children) {
            result.push({ ...child, level });
            result = [...result, ...buildHierarchy(sectionsList, child.id, level + 1)];
        }
        return result;
    };
    return buildHierarchy(sections);
  }, [sections]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`هل أنت متأكد من حذف قسم "${title}"؟`)) return;
    const toastId = toast.loading('جاري الحذف...'); 
    try {
      setDeletingId(id);
      await deleteSection(id);
      setSections(prev => prev.filter(s => s.id !== id));
      toast.success(`تم حذف قسم "${title}" بنجاح!`, { id: toastId }); 
    } catch (err) {
      toast.error('لا يمكن حذف القسم! قد يكون مرتبطاً بخدمات أخرى.', { id: toastId }); 
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // 🚀 دوال السحب والإفلات
  // ==========================================
  const handleDragStart = (e, section) => {
      setDraggedSection(section);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, section) => {
      e.preventDefault(); 
      if (draggedSection && draggedSection.id !== section.id) {
          setDragOverId(section.id);
      }
  };

  const handleDragLeave = () => {
      setDragOverId(null);
  };

  const handleDrop = async (e, targetSection) => {
      e.preventDefault();
      setDragOverId(null);

      if (!draggedSection || draggedSection.id === targetSection.id || draggedSection.parentId === targetSection.id) return;

      if (!window.confirm(`هل تريد نقل القسم "${draggedSection.title}" ليصبح فرعياً داخل "${targetSection.title}"؟`)) {
          setDraggedSection(null);
          return;
      }

      const toastId = toast.loading('جاري تحديث الهيكلية...');
      setUpdatingHierarchy(true);
      try {
          await assignChildSection(targetSection.id, draggedSection.id);
          toast.success('تم نقل القسم بنجاح!', { id: toastId });
          await loadSections(); 
      } catch (error) {
          toast.error('فشل النقل. لا يمكن وضع قسم رئيسي داخل قسم فرعي تابع له.', { id: toastId });
      } finally {
          setDraggedSection(null);
          setUpdatingHierarchy(false);
      }
  };

  const handleUnlink = async (childSection) => {
      if (!window.confirm(`هل تريد فك ارتباط القسم "${childSection.title}" ليعود قسماً رئيسياً؟`)) return;
      const toastId = toast.loading('جاري فك الارتباط...');
      setUpdatingHierarchy(true);
      try {
          await removeChildSection(childSection.parentId, childSection.id);
          toast.success('تم فك الارتباط بنجاح!', { id: toastId });
          await loadSections();
      } catch (error) {
          toast.error('فشل فك الارتباط.', { id: toastId });
      } finally {
          setUpdatingHierarchy(false);
      }
  };

  if (loading && sections.length === 0) return <LoadingSpinner message="جاري جلب الأقسام..." />;

  return (
    <div className="sections-page animate-fade-in text-end" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1 text-dark">إدارة الأقسام</h3>
          <p className="text-muted small mb-0">اسحب أي قسم وأفلته فوق قسم آخر لجعله فرعياً منه.</p>
        </div>
        <button className="btn btn-success d-flex align-items-center justify-content-center gap-2 px-4 shadow-sm w-100 w-md-auto" onClick={() => navigate('/admin/sections/create')}>
          <PlusLg /> إضافة قسم جديد
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadSections} inline={false} />}

      {!error && (
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
          <div className="card-body p-0">
            {hierarchicalSections.length === 0 ? (
              <div className="text-center py-5 px-3">
                <Folder2Open size={50} className="text-muted mb-3 opacity-25" />
                <p className="text-muted">لا توجد أقسام حالياً في قاعدة البيانات.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-secondary small text-uppercase">
                    <tr>
                        <th className="px-3 px-md-4 py-3">القسم (اسحب للترتيب)</th>
                        <th className="py-3 d-none d-lg-table-cell">الوصف</th>
                        <th className="py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hierarchicalSections.map((section) => (
                      <tr 
                        key={section.id} 
                        draggable={!updatingHierarchy}
                        onDragStart={(e) => handleDragStart(e, section)}
                        onDragOver={(e) => handleDragOver(e, section)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section)}
                        className={`
                            ${deletingId === section.id ? 'bg-light opacity-50' : ''} 
                            ${dragOverId === section.id ? 'table-active border-primary border-2 shadow-sm' : ''}
                        `}
                        style={{ 
                            transition: 'all 0.2s', 
                            opacity: draggedSection?.id === section.id ? 0.4 : 1,
                            cursor: updatingHierarchy ? 'wait' : 'default' 
                        }}
                      >
                        <td className="px-3 px-md-4">
                          <div style={{ marginRight: `${section.level * 30}px` }} className="d-flex align-items-center gap-3">
                            <ArrowsMove className="text-muted" style={{cursor: updatingHierarchy ? 'wait' : 'grab'}} title="اسحب لنقل القسم" />
                            <img src={section.imageUrl ? getImageUrl(section.imageUrl) : 'https://via.placeholder.com/45'} alt={section.title} className="rounded shadow-sm border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/45?text=No+Image'; }} />
                            <div>
                                <div className="fw-bold text-dark">
                                    {section.level > 0 && <span className="text-muted me-1">└─</span>}
                                    {section.title}
                                </div>
                                <span className="badge bg-secondary-subtle text-secondary fw-normal mt-1" style={{ fontSize: '0.65rem' }}>{section.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell"><span className="text-muted small text-truncate d-inline-block" style={{maxWidth: '250px'}}>{section.description || 'بدون وصف...'}</span></td>
                        <td className="text-center px-2 px-md-4">
                          <div className="d-flex justify-content-center gap-1 gap-md-2">
                            {section.parentId && (
                                <button className="btn btn-outline-warning btn-sm border-0 px-2" title="فك الارتباط (جعله رئيسياً)" disabled={updatingHierarchy} onClick={() => handleUnlink(section)}>
                                    <ArrowUpCircle size={16} />
                                </button>
                            )}
                            <button className="btn btn-outline-primary btn-sm border-0 px-2" title="تعديل" disabled={updatingHierarchy} onClick={() => navigate(`/admin/sections/edit/${section.id}`)}><PencilSquare size={16} /></button>
                            <button className="btn btn-outline-danger btn-sm border-0 px-2" title="حذف" disabled={deletingId === section.id || updatingHierarchy} onClick={() => handleDelete(section.id, section.title)}>
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