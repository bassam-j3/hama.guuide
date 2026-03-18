import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, ArrowsMove, ArrowUpCircle } from 'react-bootstrap-icons';
import { getImageUrl } from '../../api/axiosConfig'; 
import ErrorMessage from '../../components/common/ErrorMessage';
import TableSkeleton from '../../components/common/TableSkeleton';
import { confirmAction } from '../../utils/alerts'; // 🚀 استيراد أداة التنبيهات الاحترافية

import { useSections, useDeleteSection, useAssignChildSection, useRemoveChildSection } from '../../hooks/api/useSections';

const SectionsManagementPage = () => {
    const navigate = useNavigate();
    const { triggerGlobalRefresh } = useOutletContext(); 

    const [draggedSection, setDraggedSection] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    const { data: sectionsData, isLoading, isError } = useSections();
    const deleteMutation = useDeleteSection();
    const assignMutation = useAssignChildSection(); 
    const removeMutation = useRemoveChildSection(); 

    const sections = Array.isArray(sectionsData) ? sectionsData : (sectionsData?.items || []);

    // 🚀 بناء الشجرة الهرمية لمعرفة المستويات
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

    // 🚀 استخدام confirmAction بدلاً من window.confirm
    const handleDelete = async (id) => {
        const confirmed = await confirmAction('حذف القسم', 'هل أنت متأكد من حذف هذا القسم؟ هذه العملية لا يمكن التراجع عنها.');
        if (confirmed) {
            deleteMutation.mutate(id);
        }
    };

    const handleDrop = async (e, targetSection) => {
        e.preventDefault(); 
        setDragOverId(null);
        
        if (!draggedSection || draggedSection.id === targetSection.id) return;
        if (draggedSection.parentId === targetSection.id) return; // هو بالفعل ابن له
        
        const confirmed = await confirmAction('نقل القسم', `هل تريد جعل "${draggedSection.title}" قسماً فرعياً تحت "${targetSection.title}"؟`);
        if (confirmed) {
            assignMutation.mutate({ parentId: targetSection.id, childId: draggedSection.id });
        }
    };

    const handleRemoveParent = async (parentId, childId) => {
        const confirmed = await confirmAction('فك الارتباط', 'هل تريد فك ارتباط هذا القسم ليصبح قسماً رئيسياً مستقلاً؟');
        if (confirmed) {
            removeMutation.mutate({ parentId, childId });
        }
    };

    if (isLoading) return <div className="p-4"><TableSkeleton columns={3} rows={6} /></div>;

    return (
        <div className="sections-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إدارة الأقسام</h3>
                    <p className="text-muted small mb-0">اسحب القسم وأفلته فوق قسم آخر لترتيب الهيكلية.</p>
                </div>
                <button className="btn btn-success btn-sm px-4 shadow-sm d-flex align-items-center gap-2" onClick={() => navigate('/admin/sections/create')}>
                    <PlusLg /> إضافة قسم جديد
                </button>
            </div>

            {isError && <ErrorMessage message="تعذر جلب الأقسام من الخادم." />}

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-muted small">
                            <tr>
                                <th className="px-4 py-3 border-0">القسم (اسحب للترتيب)</th>
                                <th className="py-3 d-none d-lg-table-cell border-0">الوصف</th>
                                <th className="py-3 text-center border-0">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hierarchicalSections.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-5 text-muted">لا يوجد أقسام مضافة بعد.</td></tr>
                            ) : (
                                hierarchicalSections.map((section) => (
                                    <tr 
                                        key={section.id} 
                                        draggable={!isProcessing}
                                        onDragStart={(e) => { 
                                            setDraggedSection(section); 
                                            e.dataTransfer.effectAllowed = 'move'; 
                                        }}
                                        onDragOver={(e) => { 
                                            e.preventDefault(); 
                                            if(draggedSection?.id !== section.id) setDragOverId(section.id); 
                                        }}
                                        onDragLeave={() => setDragOverId(null)}
                                        onDrop={(e) => handleDrop(e, section)}
                                        className={`border-bottom transition-all ${dragOverId === section.id ? 'table-primary border-primary border-2' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div style={{ marginRight: `${section.level * 35}px` }} className="d-flex align-items-center gap-3">
                                                <ArrowsMove className={isProcessing ? "text-muted opacity-25" : "text-primary"} style={{ cursor: isProcessing ? 'not-allowed' : 'grab' }} title="اسحب القسم من هنا" />
                                                {section.imageUrl ? (
                                                    <img src={getImageUrl(section.imageUrl)} className="rounded-3 shadow-sm object-fit-cover" style={{ width: '45px', height: '45px' }} alt={section.title} />
                                                ) : (
                                                    <div className="bg-light rounded-3 d-flex justify-content-center align-items-center text-muted small" style={{ width: '45px', height: '45px' }}>N/A</div>
                                                )}
                                                <div className="fw-bold text-dark">
                                                    {section.title}
                                                    {section.parentId && <span className="badge bg-info bg-opacity-10 text-info ms-2 border border-info border-opacity-25 small">فرعي</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="d-none d-lg-table-cell text-muted small py-3">
                                            {section.description || <span className="opacity-50">-</span>}
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <div className="d-flex justify-content-center gap-2">
                                                {section.parentId && (
                                                    <button className="btn btn-sm btn-light text-warning hover-bg-warning hover-text-white transition-all" onClick={() => handleRemoveParent(section.parentId, section.id)} disabled={isProcessing} title="فصله ليصبح قسماً رئيسياً">
                                                        {removeMutation.isPending && removeMutation.variables?.childId === section.id ? <span className="spinner-border spinner-border-sm" /> : <ArrowUpCircle size={15} />}
                                                    </button>
                                                )}
                                                <button className="btn btn-sm btn-light text-primary hover-bg-primary hover-text-white transition-all" onClick={() => navigate(`/admin/sections/edit/${section.id}`)} disabled={isProcessing} title="تعديل القسم">
                                                    <PencilSquare size={15} />
                                                </button>
                                                <button className="btn btn-sm btn-light text-danger hover-bg-danger hover-text-white transition-all" onClick={() => handleDelete(section.id)} disabled={isProcessing} title="حذف القسم">
                                                    {deleteMutation.isPending && deleteMutation.variables === section.id ? <span className="spinner-border spinner-border-sm" /> : <Trash size={15} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SectionsManagementPage;