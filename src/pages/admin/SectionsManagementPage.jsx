import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, ArrowsMove, ArrowUpCircle } from 'react-bootstrap-icons';
import { getImageUrl } from '../../api/axiosConfig'; 
import ErrorMessage from '../../components/common/ErrorMessage';
import TableSkeleton from '../../components/common/TableSkeleton';
import toast from 'react-hot-toast';
import { useSections, useDeleteSection, useAssignChildSection, useRemoveChildSection } from '../../hooks/api/useSections';

const SectionsManagementPage = () => {
    const navigate = useNavigate();

    const [draggedSection, setDraggedSection] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);

    const { data: sectionsData, isLoading, isError } = useSections();
    const deleteMutation = useDeleteSection();
    const assignMutation = useAssignChildSection(); 
    const removeMutation = useRemoveChildSection(); 

    const sections = Array.isArray(sectionsData) ? sectionsData : [];

    // 🚀 Senior Fix: بناء الشجرة اللانهائية للعرض بدقة
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

    const handleDelete = (id, title) => {
        // تحذير شديد اللهجة لأن الحذف أصبح متسلسلاً!
        if (window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف القسم "${title}"؟\nسيتم حذف كافة الأقسام الفرعية التابعة له وكافة الخدمات المرتبطة به بشكل نهائي!`)) {
            const toastId = toast.loading('جاري الحذف المتسلسل (الرجاء الانتظار)...');
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success('تم الحذف بالكامل!', { id: toastId }),
                onError: () => toast.error('فشل الحذف. حاول مرة أخرى.', { id: toastId })
            });
        }
    };

    const handleDrop = (e, targetSection) => {
        e.preventDefault(); 
        setDragOverId(null);
        
        if (!draggedSection || draggedSection.id === targetSection.id) return;
        if (draggedSection.parentId === targetSection.id) return;
        
        if (window.confirm(`هل تريد نقل "${draggedSection.title}" ليكون تحت "${targetSection.title}"؟`)) {
            assignMutation.mutate({ parentId: targetSection.id, childId: draggedSection.id }, {
                onError: () => toast.error("فشل الربط! تأكد أن الباك-إند يدعم هذا المسار.")
            });
        }
    };

    const handleRemoveParent = (parentId, childId) => {
        if (window.confirm('هل تريد فك الارتباط وجعل هذا القسم رئيسياً؟')) {
            removeMutation.mutate({ parentId, childId });
        }
    };

    if (isLoading) return <div className="p-4"><TableSkeleton columns={3} rows={6} /></div>;
    if (isError) return <ErrorMessage message="تعذر جلب الأقسام من الخادم." />;

    return (
        <div className="sections-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إدارة الأقسام</h3>
                    <p className="text-muted small mb-0">اسحب القسم وأفلته لترتيب الهيكلية اللانهائية.</p>
                </div>
                <button className="btn btn-success btn-sm px-4 shadow-sm" onClick={() => navigate('/admin/sections/create')}>
                    <PlusLg className="me-2"/> إضافة قسم
                </button>
            </div>

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
                                        onDragStart={(e) => { setDraggedSection(section); e.dataTransfer.effectAllowed = 'move'; }}
                                        onDragOver={(e) => { e.preventDefault(); if(draggedSection?.id !== section.id) setDragOverId(section.id); }}
                                        onDragLeave={() => setDragOverId(null)}
                                        onDrop={(e) => handleDrop(e, section)}
                                        className={dragOverId === section.id ? 'table-primary border-primary border-2' : ''}
                                    >
                                        <td className="px-4 py-3">
                                            <div style={{ marginRight: `${section.level * 40}px` }} className="d-flex align-items-center gap-3">
                                                <ArrowsMove className={isProcessing ? "text-muted opacity-25" : "text-primary"} style={{ cursor: isProcessing ? 'not-allowed' : 'grab' }} />
                                                <img src={section.imageUrl ? getImageUrl(section.imageUrl) : 'https://via.placeholder.com/45'} className="rounded-3 shadow-sm object-fit-cover" style={{ width: '45px', height: '45px' }} alt="" />
                                                <div className="fw-bold text-dark">
                                                    {section.title}
                                                    {section.parentId && <span className="badge bg-info bg-opacity-10 text-info ms-2 border border-info border-opacity-25 small">L{section.level}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="d-none d-lg-table-cell text-muted small py-3">{section.description || '-'}</td>
                                        <td className="text-center px-4 py-3">
                                            <div className="d-flex justify-content-center gap-2">
                                                {section.parentId && (
                                                    <button className="btn btn-sm btn-light text-warning" onClick={() => handleRemoveParent(section.parentId, section.id)} disabled={isProcessing}>
                                                        <ArrowUpCircle size={15} />
                                                    </button>
                                                )}
                                                <button className="btn btn-sm btn-light text-primary" onClick={() => navigate(`/admin/sections/edit/${section.id}`)} disabled={isProcessing}>
                                                    <PencilSquare size={15} />
                                                </button>
                                                <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(section.id, section.title)} disabled={isProcessing}>
                                                    <Trash size={15} />
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