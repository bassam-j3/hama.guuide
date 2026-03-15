import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, Folder2Open, ArrowsMove, ArrowUpCircle } from 'react-bootstrap-icons';
import { getImageUrl } from '../../api/axiosConfig'; 
import ErrorMessage from '../../components/common/ErrorMessage';
import TableSkeleton from '../../components/common/TableSkeleton';
import toast from 'react-hot-toast';

// 🚀 استخدام هوكات الأقسام الموحدة
import { useSections, useDeleteSection, useAssignChildSection, useRemoveChildSection } from '../../hooks/api/useSections';

const SectionsManagementPage = () => {
  const navigate = useNavigate();
  const { triggerGlobalRefresh } = useOutletContext(); 

  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // 🚀 جلب البيانات
  const { data: sectionsData, isLoading, isError } = useSections();

  // 🚀 العمليات (Mutations)
  const deleteMutation = useDeleteSection();
  const assignMutation = useAssignChildSection(); // تأكد من إنشاء هذا الهوك في useSections.js
  const removeMutation = useRemoveChildSection(); // تأكد من إنشاء هذا الهوك في useSections.js

  const sections = Array.isArray(sectionsData) ? sectionsData : (sectionsData?.items || sectionsData?.data || []);

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

  const isProcessing = deleteMutation.isPending || assignMutation.isPending || removeMutation.isPending;

  if (isLoading) return <TableSkeleton columns={3} rows={6} />;

  return (
    <div className="sections-page animate-fade-in text-end" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1">إدارة الأقسام</h3>
          <p className="text-muted small">اسحب لترتيب الهيكلية.</p>
        </div>
        <button className="btn btn-success btn-sm px-4 shadow-sm" onClick={() => navigate('/admin/sections/create')}>
          <PlusLg /> إضافة قسم جديد
        </button>
      </div>

      {isError && <ErrorMessage message="تعذر جلب الأقسام." />}

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3">القسم (اسحب للترتيب)</th>
                <th className="py-3 d-none d-lg-table-cell">الوصف</th>
                <th className="py-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {hierarchicalSections.map((section) => (
                <tr 
                  key={section.id} 
                  draggable={!isProcessing}
                  onDragStart={(e) => { setDraggedSection(section); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={(e) => { e.preventDefault(); if(draggedSection?.id !== section.id) setDragOverId(section.id); }}
                  onDrop={(e) => {
                      e.preventDefault(); setDragOverId(null);
                      if (!draggedSection || draggedSection.id === section.id) return;
                      if (window.confirm(`نقل "${draggedSection.title}" إلى "${section.title}"؟`)) {
                        assignMutation.mutate({ parentId: section.id, childId: draggedSection.id });
                      }
                  }}
                  className={dragOverId === section.id ? 'table-active border-primary' : ''}
                >
                  <td className="px-4">
                    <div style={{ marginRight: `${section.level * 30}px` }} className="d-flex align-items-center gap-3">
                      <ArrowsMove className="text-muted" style={{cursor: 'grab'}} />
                      <img src={section.imageUrl ? getImageUrl(section.imageUrl) : 'https://via.placeholder.com/45'} className="rounded" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                      <div className="fw-bold">{section.title}</div>
                    </div>
                  </td>
                  <td className="d-none d-lg-table-cell text-muted small">{section.description || '-'}</td>
                  <td className="text-center px-4">
                    <div className="d-flex justify-content-center gap-2">
                      {section.parentId && (
                        <button className="btn btn-sm btn-light text-warning" onClick={() => removeMutation.mutate({ parentId: section.parentId, childId: section.id })} disabled={isProcessing}>
                            {removeMutation.isPending && removeMutation.variables?.childId === section.id ? <span className="spinner-border spinner-border-sm" /> : <ArrowUpCircle />}
                        </button>
                      )}
                      <button className="btn btn-sm btn-light text-primary" onClick={() => navigate(`/admin/sections/edit/${section.id}`)}><PencilSquare /></button>
                      <button className="btn btn-sm btn-light text-danger" onClick={() => { if(window.confirm('حذف؟')) deleteMutation.mutate(section.id) }} disabled={isProcessing}>
                        {deleteMutation.isPending && deleteMutation.variables === section.id ? <span className="spinner-border spinner-border-sm" /> : <Trash />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default SectionsManagementPage;