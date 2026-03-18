import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, Search, Funnel, Image as ImageIcon, Folder, ExclamationTriangleFill } from 'react-bootstrap-icons';
import { getImageUrl } from '../../api/axiosConfig'; 
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast'; 
import { useDebounce } from '../../hooks/useDebounce';
import TableSkeleton from '../../components/common/TableSkeleton'; 
import { useQueryClient } from '@tanstack/react-query';

import { useServices, useDeleteService } from '../../hooks/api/useServices';
import { deleteService } from '../../api/services/serviceService'; // 🚀 استيراد دالة الحذف الجماعي
import { useSections } from '../../hooks/api/useSections';
import { confirmAction } from '../../utils/alerts';

const ServicesManagementPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300); 
    const [filterSection, setFilterSection] = useState('');

    const { data: rawServices, isLoading: loadingServices, isError: errorServices } = useServices();
    const { data: rawSections } = useSections();
    const deleteMutation = useDeleteService();

    const services = Array.isArray(rawServices) ? rawServices : (rawServices?.items || rawServices?.data || []);
    // استبعاد الخدمات من قائمة الأقسام
    const sections = Array.isArray(rawSections) ? rawSections.filter(s => !s.hasOwnProperty('sectionId')) : [];

    const sectionsMap = useMemo(() => {
        return sections.reduce((acc, sec) => { acc[sec.id] = sec.title; return acc; }, {});
    }, [sections]);

    // 🚀 Senior Fix: اكتشاف الخدمات اليتيمة
    const orphans = services.filter(s => !s.sectionId);

    // 🚀 Senior Fix: التنظيف الجذري للخدمات اليتيمة بضغطة زر واحدة (Bulk Delete)
    const handleCleanOrphans = async () => {
        if (orphans.length === 0) {
            toast.success("النظام نظيف! لا توجد بيانات يتيمة.");
            return;
        }
        const confirmed = await confirmAction('تدمير البيانات اليتيمة', `سيتم حذف ${orphans.length} خدمة يتيمة بشكل نهائي لا رجعة فيه! هل أنت متأكد؟`);
        if (confirmed) {
            const toastId = toast.loading(`جاري تدمير ${orphans.length} خدمة يتيمة...`);
            try {
                // إرسال طلبات الحذف بشكل متوازٍ وسريع
                await Promise.all(orphans.map(s => deleteService(s.id)));
                toast.success('تم تنظيف كافة البيانات اليتيمة بنجاح!', { id: toastId });
                queryClient.invalidateQueries({ queryKey: ['services'] });
            } catch (err) {
                toast.error('حدث خطأ أثناء تنظيف بعض الخدمات.', { id: toastId });
                queryClient.invalidateQueries({ queryKey: ['services'] });
            }
        }
    };

    const handleDelete = async (id, title) => {
        const confirmed = await confirmAction('حذف الخدمة', `هل أنت متأكد من حذف خدمة "${title}"؟`);
        if (confirmed) {
            deleteMutation.mutate(id);
        }
    };

    const filteredServices = services.filter(service => {
        const matchesSearch = (service.title || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                              (service.slug || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        
        let matchesSection = true;
        if (filterSection === 'ORPHAN') {
            matchesSection = !service.sectionId; // فلتر الخدمات اليتيمة
        } else if (filterSection) {
            matchesSection = service.sectionId === filterSection;
        }
        return matchesSearch && matchesSection;
    });

    if (loadingServices) {
        return (
            <div className="services-page animate-fade-in text-end" dir="rtl">
                <TableSkeleton columns={4} rows={5} />
            </div>
        );
    }

    return (
        <div className="services-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 p-md-4 rounded-3 shadow-sm border flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إدارة الخدمات</h3>
                    <p className="text-muted small mb-0">إجمالي الخدمات: {services.length} | الخدمات اليتيمة: <span className="text-danger fw-bold">{orphans.length}</span></p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {/* زر تنظيف الأيتام يظهر فقط إذا وجدت بيانات يتيمة */}
                    {orphans.length > 0 && (
                        <button className="btn btn-danger btn-sm px-4 shadow-sm fw-bold d-flex align-items-center gap-2" onClick={handleCleanOrphans}>
                            <ExclamationTriangleFill /> تنظيف اليتيمة ({orphans.length})
                        </button>
                    )}
                    <button className="btn btn-success btn-sm px-4 shadow-sm fw-bold d-flex align-items-center gap-2" onClick={() => navigate('/admin/services/create')}>
                        <PlusLg /> إضافة خدمة
                    </button>
                </div>
            </div>

            {errorServices && <ErrorMessage message="فشل تحميل الخدمات." />}

            <div className="card border-0 shadow-sm mb-4 bg-white">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-12 col-md-8">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><Search /></span>
                                <input type="text" className="form-control border-start-0" placeholder="ابحث باسم الخدمة أو الرابط..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0"><Funnel /></span>
                                <select className="form-select border-start-0" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                                    <option value="">كل الأقسام</option>
                                    <option value="ORPHAN" className="text-danger fw-bold">⚠️ بدون قسم (يتيمة)</option>
                                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.title}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-secondary small text-uppercase">
                            <tr>
                                <th className="ps-3 ps-md-4 py-3 border-0">الخدمة</th>
                                <th className="py-3 d-none d-md-table-cell border-0">القسم التابع له</th>
                                <th className="py-3 d-none d-lg-table-cell border-0">المسار</th>
                                <th className="text-center py-3 border-0">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-5 text-muted">لا يوجد خدمات مطابقة للبحث.</td></tr>
                            ) : (
                                filteredServices.map(service => (
                                    <tr key={service.id} className={!service.sectionId ? 'table-danger border-danger border-opacity-25' : 'border-bottom'}>
                                        <td className="ps-3 ps-md-4 py-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="rounded border bg-white shadow-sm d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '45px', height: '45px', overflow: 'hidden'}}>
                                                    {service.imageUrl ? <img src={getImageUrl(service.imageUrl)} alt="" className="w-100 h-100 object-fit-cover" /> : <ImageIcon className="text-muted opacity-25" size={20} />}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{service.title}</div>
                                                    {!service.sectionId && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 small">⚠️ خدمة يتيمة</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="d-none d-md-table-cell py-3">
                                            {service.sectionId && sectionsMap[service.sectionId] ? (
                                                <span className="badge bg-primary-subtle text-primary border rounded-pill px-3 py-2"><Folder size={12} className="me-1"/> {sectionsMap[service.sectionId]}</span>
                                            ) : (
                                                <span className="text-danger small fw-bold">بدون قسم</span>
                                            )}
                                        </td>
                                        <td className="small font-monospace text-muted d-none d-lg-table-cell py-3" dir="ltr">{service.slug}</td>
                                        <td className="text-center px-2 py-3">
                                            <div className="d-flex justify-content-center gap-2">
                                                <button className="btn btn-sm btn-light text-primary hover-bg-primary hover-text-white transition-all" onClick={() => navigate(`/admin/services/edit/${service.id}`)} title="تعديل"><PencilSquare size={15} /></button>
                                                <button className="btn btn-sm btn-light text-danger hover-bg-danger hover-text-white transition-all" onClick={() => handleDelete(service.id, service.title)} disabled={deleteMutation.isPending} title="حذف">
                                                    {deleteMutation.isPending && deleteMutation.variables === service.id ? <span className="spinner-border spinner-border-sm" /> : <Trash size={15} />}
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

export default ServicesManagementPage;