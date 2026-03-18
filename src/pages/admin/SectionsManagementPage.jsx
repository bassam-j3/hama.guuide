import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, ArrowsMove, ArrowUpCircle, ChevronDown, ChevronLeft } from 'react-bootstrap-icons';
import { getImageUrl } from '../../api/axiosConfig'; 
import ErrorMessage from '../../components/common/ErrorMessage';
import TableSkeleton from '../../components/common/TableSkeleton';
import toast from 'react-hot-toast';
import { useSections, useDeleteSection, useAssignChildSection, useRemoveChildSection } from '../../hooks/api/useSections';

const SectionsManagementPage = () => {
    const navigate = useNavigate();

    const [draggedSection, setDraggedSection] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    
    // حالة لتتبع الأقسام المفتوحة (Expanded)
    const [expandedSections, setExpandedSections] = useState({});

    const { data: sectionsData, isLoading, isError } = useSections();
    const deleteMutation = useDeleteSection();
    const assignMutation = useAssignChildSection(); 
    const removeMutation = useRemoveChildSection(); 

    const sections = Array.isArray(sectionsData) ? sectionsData : [];
    
    // استخراج الجذور فقط (الأقسام الرئيسية)
    const rootSections = sections.filter(s => !s.parentId);
    
    const isProcessing = deleteMutation.isPending || assignMutation.isPending || removeMutation.isPending;

    const toggleSection = (id) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDelete = (id, title) => {
        if (window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف القسم "${title}"؟\nسيتم حذف كافة الأقسام الفرعية التابعة له والخدمات بشكل نهائي!`)) {
            const toastId = toast.loading('جاري الحذف المتسلسل...');
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success('تم الحذف!', { id: toastId }),
                onError: () => toast.error('فشل الحذف.', { id: toastId })
            });
        }
    };

    const handleDrop = (e, targetSection) => {
        e.preventDefault(); 
        setDragOverId(null);
        
        if (!draggedSection || draggedSection.id === targetSection.id) return;
        if (draggedSection.parentId === targetSection.id) return;
        
        if (window.confirm(`نقل "${draggedSection.title}" تحت "${targetSection.title}"؟`)) {
            assignMutation.mutate({ parentId: targetSection.id, childId: draggedSection.id }, {
                onError: () => toast.error("فشل الربط!")
            });
        }
    };

    const handleRemoveParent = (parentId, childId) => {
        if (window.confirm('هل تريد فك الارتباط وجعل هذا القسم رئيسياً؟')) {
            removeMutation.mutate({ parentId, childId });
        }
    };

    // 🚀 Senior Fix: مكون متكرر (Recursive Component) لرسم الشجرة
    const SectionRow = ({ section, level = 0 }) => {
        const children = sections.filter(s => s.parentId === section.id);
        const hasChildren = children.length > 0;
        const isExpanded = !!expandedSections[section.id];

        return (
            <React.Fragment>
                <tr 
                    draggable={!isProcessing}
                    onDragStart={(e) => { setDraggedSection(section); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragOver={(e) => { e.preventDefault(); if(draggedSection?.id !== section.id) setDragOverId(section.id); }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => handleDrop(e, section)}
                    className={`border-bottom transition-all ${dragOverId === section.id ? 'table-primary border-primary border-2' : ''}`}
                >
                    <td className="px-4 py-3">
                        <div style={{ paddingRight: `${level * 40}px` }} className="d-flex align-items-center gap-3">
                            <ArrowsMove className={isProcessing ? "text-muted opacity-25" : "text-primary"} style={{ cursor: isProcessing ? 'not-allowed' : 'grab' }} />
                            
                            {/* زر الطي والفتح (Dropdown) */}
                            <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
                                {hasChildren && (
                                    <button 
                                        className="btn btn-sm btn-link p-0 text-dark shadow-none border-0" 
                                        onClick={() => toggleSection(section.id)}
                                    >
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
                                    </button>
                                )}
                            </div>

                            <img src={section.imageUrl ? getImageUrl(section.imageUrl) : 'https://via.placeholder.com/45'} className="rounded-3 shadow-sm object-fit-cover" style={{ width: '40px', height: '40px' }} alt="" />
                            
                            <div className="fw-bold text-dark">
                                {section.title}
                                {level > 0 && <span className="badge bg-info bg-opacity-10 text-info ms-2 border border-info border-opacity-25 small">L{level}</span>}
                            </div>
                        </div>
                    </td>
                    <td className="d-none d-lg-table-cell text-muted small py-3">{section.description || '-'}</td>
                    <td className="text-center px-4 py-3">
                        <div className="d-flex justify-content-center gap-2">
                            {section.parentId && (
                                <button className="btn btn-sm btn-light text-warning" onClick={() => handleRemoveParent(section.parentId, section.id)} disabled={isProcessing} title="فك الارتباط ليصبح قسماً رئيسياً">
                                    <ArrowUpCircle size={15} />
                                </button>
                            )}
                            <button className="btn btn-sm btn-light text-primary" onClick={() => navigate(`/admin/sections/edit/${section.id}`)} disabled={isProcessing} title="تعديل">
                                <PencilSquare size={15} />
                            </button>
                            <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(section.id, section.title)} disabled={isProcessing} title="حذف">
                                <Trash size={15} />
                            </button>
                        </div>
                    </td>
                </tr>
                {/* استدعاء متكرر (Recursion) لرسم الأبناء إذا كان القسم مفتوحاً */}
                {isExpanded && hasChildren && children.map(child => (
                    <SectionRow key={child.id} section={child} level={level + 1} />
                ))}
            </React.Fragment>
        );
    };

    if (isLoading) return <div className="p-4"><TableSkeleton columns={3} rows={6} /></div>;
    if (isError) return <ErrorMessage message="تعذر جلب الأقسام من الخادم." />;

    return (
        <div className="sections-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إدارة الأقسام</h3>
                    <p className="text-muted small mb-0">استعرض الشجرة الهرمية، واسحب الأقسام لترتيبها.</p>
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
                                <th className="px-4 py-3 border-0">الهيكلية (شجرة الأقسام)</th>
                                <th className="py-3 d-none d-lg-table-cell border-0">الوصف</th>
                                <th className="py-3 text-center border-0">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rootSections.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-5 text-muted">لا يوجد أقسام رئيسية. أضف قسمك الأول!</td></tr>
                            ) : (
                                rootSections.map((section) => (
                                    <SectionRow key={section.id} section={section} level={0} />
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