import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash, Tag, Link as LinkIcon, Diagram3 } from 'react-bootstrap-icons';
import { useSections, useDeleteSection, useAssignChildSection, useRemoveChildSection } from '../../hooks/api/useSections';
import { confirmAction } from '../../utils/alerts';
import TableSkeleton from '../../components/common/TableSkeleton';
import ErrorMessage from '../../components/common/ErrorMessage';
import { getImageUrl } from '../../api/axiosConfig';

const SectionsManagementPage = () => {
    const navigate = useNavigate();
    const { data: sections, isLoading, isError } = useSections();
    const deleteMutation = useDeleteSection();
    
    // الهوكات الخاصة بربط الأقسام
    const assignMutation = useAssignChildSection();
    const removeChildMutation = useRemoveChildSection();

    const [linkParentId, setLinkParentId] = useState('');
    const [linkChildId, setLinkChildId] = useState('');

    const handleDelete = async (id) => {
        const confirmed = await confirmAction('حذف القسم', 'هل أنت متأكد من حذف هذا القسم؟ هذه العملية لا يمكن التراجع عنها.');
        if (confirmed) {
            deleteMutation.mutate(id);
        }
    };

    // 🚀 Senior Fix: التأكد من إرسال ParentId و ChildId بشكل صحيح
    const handleAssignChild = () => {
        if (!linkParentId || !linkChildId) return;
        if (linkParentId === linkChildId) {
            alert('لا يمكن للقسم أن يكون أباً لنفسه!');
            return;
        }
        assignMutation.mutate({ parentId: linkParentId, childId: linkChildId });
    };

    if (isLoading) return <div className="p-4"><TableSkeleton columns={5} /></div>;
    if (isError) return <ErrorMessage message="فشل في تحميل الأقسام. يرجى المحاولة لاحقاً." />;

    const safeSections = Array.isArray(sections) ? sections : [];

    return (
        <div className="sections-management animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إدارة الأقسام</h3>
                    <p className="text-muted small mb-0">إدارة الأقسام الرئيسية والفرعية للنظام</p>
                </div>
                <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4" onClick={() => navigate('/admin/sections/create')}>
                    <Plus size={20} /> <span className="fw-bold">إضافة قسم جديد</span>
                </button>
            </div>

            {/* 🚀 قسم تجريبي لربط الأقسام ببعضها */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-white p-3 border-bottom d-flex align-items-center gap-2">
                    <Diagram3 className="text-success" /> <span className="fw-bold text-dark">ربط قسم فرعي بقسم رئيسي</span>
                </div>
                <div className="card-body p-3 d-flex gap-2 flex-wrap">
                    <select className="form-select flex-grow-1" value={linkParentId} onChange={e => setLinkParentId(e.target.value)}>
                        <option value="">-- اختر القسم الأب --</option>
                        {safeSections.map(s => <option key={`p_${s.id}`} value={s.id}>{s.title}</option>)}
                    </select>
                    <select className="form-select flex-grow-1" value={linkChildId} onChange={e => setLinkChildId(e.target.value)}>
                        <option value="">-- اختر القسم الابن --</option>
                        {safeSections.map(s => <option key={`c_${s.id}`} value={s.id}>{s.title}</option>)}
                    </select>
                    <button className="btn btn-success d-flex align-items-center gap-2" onClick={handleAssignChild} disabled={assignMutation.isPending || !linkParentId || !linkChildId}>
                        {assignMutation.isPending ? <span className="spinner-border spinner-border-sm"/> : <LinkIcon />} ربط
                    </button>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover table-borderless align-middle mb-0 text-center">
                        <thead className="bg-light text-muted small">
                            <tr>
                                <th className="py-3 px-4 rounded-end-3">الصورة</th>
                                <th className="py-3">العنوان</th>
                                <th className="py-3">الرابط (Slug)</th>
                                <th className="py-3">القسم الأب</th>
                                <th className="py-3 rounded-start-3">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {safeSections.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">لا يوجد أقسام مضافة بعد.</td></tr>
                            ) : (
                                safeSections.map((section) => (
                                    <tr key={section.id} className="border-bottom">
                                        <td className="py-3 px-4">
                                            {section.imageUrl ? (
                                                <img src={getImageUrl(section.imageUrl)} alt={section.title} className="rounded-3 shadow-sm object-fit-cover" style={{ width: '45px', height: '45px' }} />
                                            ) : (
                                                <div className="bg-light rounded-3 d-flex justify-content-center align-items-center text-muted" style={{ width: '45px', height: '45px' }}>N/A</div>
                                            )}
                                        </td>
                                        <td className="fw-bold text-dark">{section.title}</td>
                                        <td><span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1"><Tag className="me-1"/>{section.slug}</span></td>
                                        <td>
                                            {section.parentId ? (
                                                <span className="badge bg-info text-dark">فرعي (مربوط)</span>
                                            ) : (
                                                <span className="badge bg-primary">رئيسي</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-center gap-2">
                                                <button className="btn btn-sm btn-light text-primary hover-bg-primary hover-text-white transition-all" onClick={() => navigate(`/admin/sections/edit/${section.id}`)} title="تعديل">
                                                    <Pencil size={14} />
                                                </button>
                                                {section.parentId && (
                                                    <button className="btn btn-sm btn-light text-warning hover-bg-warning hover-text-white transition-all" onClick={() => removeChildMutation.mutate({ parentId: section.parentId, childId: section.id })} disabled={removeChildMutation.isPending} title="فك الارتباط بالأب">
                                                        {removeChildMutation.isPending ? <span className="spinner-border spinner-border-sm"/> : <LinkIcon size={14} />}
                                                    </button>
                                                )}
                                                <button className="btn btn-sm btn-light text-danger hover-bg-danger hover-text-white transition-all" onClick={() => handleDelete(section.id)} disabled={deleteMutation.isPending} title="حذف">
                                                    <Trash size={14} />
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