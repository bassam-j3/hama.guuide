import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusLg, PencilSquare, Trash, Search, Funnel, Image as ImageIcon, Folder } from 'react-bootstrap-icons';
import { fetchAllServices, deleteService } from '../../api/services/serviceService';
import { fetchAllSections } from '../../api/services/sectionService';
import { getImageUrl } from '../../api/axiosConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast'; // 🚀

const ServicesManagementPage = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [isDeleting, setIsDeleting] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [servicesData, sectionsData] = await Promise.all([fetchAllServices(), fetchAllSections()]);
                setServices(servicesData?.data || servicesData?.items || servicesData || []);
                setSections(sectionsData?.data || sectionsData?.items || sectionsData || []);
            } catch (err) { setError("فشل تحميل البيانات."); } finally { setLoading(false); }
        };
        loadData();
    }, []);

    const sectionsMap = useMemo(() => {
        return Array.isArray(sections) ? sections.reduce((acc, sec) => { acc[sec.id] = sec.title; return acc; }, {}) : {};
    }, [sections]);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`تأكيد حذف خدمة "${title}"؟\nسيتم حذف جميع المنشورات المرتبطة بها.`)) return;
        
        const toastId = toast.loading('جاري حذف الخدمة...'); // 🚀
        setIsDeleting(id);
        try {
            await deleteService(id);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success(`تم الحذف بنجاح!`, { id: toastId }); // 🚀
        } catch (err) { 
            toast.error("حدث خطأ! تأكد من عدم ارتباطها ببيانات أخرى.", { id: toastId }); // 🚀
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredServices = Array.isArray(services) ? services.filter(service => {
        const matchesSearch = (service.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (service.slug || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSection = filterSection ? service.sectionId === filterSection : true;
        return matchesSearch && matchesSection;
    }) : [];

    if (loading) return <LoadingSpinner message="جاري تحميل الخدمات..." />;

    return (
        <div className="services-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 p-md-4 rounded-3 shadow-sm border flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إدارة الخدمات</h3>
                    <p className="text-muted small mb-0">عدد الخدمات: {filteredServices.length}</p>
                </div>
                <button className="btn btn-success btn-sm px-4 py-2 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto" onClick={() => navigate('/admin/services/create')}>
                    <PlusLg /> إضافة خدمة جديدة
                </button>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="card border-0 shadow-sm mb-4 bg-white">
                <div className="card-body p-3">
                    <div className="row g-2">
                        <div className="col-12 col-md-8"><div className="input-group"><span className="input-group-text bg-light border-end-0"><Search /></span><input type="text" className="form-control border-start-0" placeholder="ابحث عن اسم أو مسار (Slug)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
                        <div className="col-12 col-md-4"><div className="input-group"><span className="input-group-text bg-light border-end-0"><Funnel /></span><select className="form-select border-start-0" value={filterSection} onChange={e => setFilterSection(e.target.value)}><option value="">كل الأقسام</option>{Array.isArray(sections) && sections.map(sec => <option key={sec.id} value={sec.id}>{sec.title}</option>)}</select></div></div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-secondary small text-uppercase"><tr><th className="ps-3 ps-md-4 py-3">الخدمة</th><th className="py-3 d-none d-md-table-cell">القسم التابع له</th><th className="py-3 d-none d-lg-table-cell">المسار (Slug)</th><th className="text-center py-3">الإجراءات</th></tr></thead>
                        <tbody>
                            {filteredServices.length > 0 ? filteredServices.map(service => (
                                <tr key={service.id}>
                                    <td className="ps-3 ps-md-4">
                                        <div className="d-flex align-items-center gap-2 gap-md-3">
                                            <div className="rounded border bg-light d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '40px', height: '40px', overflow: 'hidden'}}>{service.imageUrl ? <img src={getImageUrl(service.imageUrl)} alt={service.title} className="w-100 h-100 object-fit-cover" /> : <ImageIcon className="text-muted opacity-25" size={20} />}</div>
                                            <div><div className="fw-bold text-dark">{service.title}</div><div className="d-block d-md-none small text-muted font-monospace mt-1" dir="ltr">{service.slug}</div></div>
                                        </div>
                                    </td>
                                    <td className="d-none d-md-table-cell">{service.sectionId && sectionsMap[service.sectionId] ? <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2"><Folder size={12} /> {sectionsMap[service.sectionId]}</span> : <span className="text-muted small fst-italic">-</span>}</td>
                                    <td className="small font-monospace text-muted d-none d-lg-table-cell" dir="ltr">{service.slug}</td>
                                    <td className="text-center px-2">
                                        <div className="d-flex justify-content-center gap-1 gap-md-2">
                                            <button className="btn btn-sm btn-white border text-primary" onClick={() => navigate(`/admin/services/edit/${service.id}`)} disabled={isDeleting === service.id}><PencilSquare /></button>
                                            <button className="btn btn-sm btn-white border text-danger" onClick={() => handleDelete(service.id, service.title)} disabled={isDeleting === service.id}>{isDeleting === service.id ? <span className="spinner-border spinner-border-sm" /> : <Trash />}</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="4" className="text-center py-5"><p className="text-muted mb-0">لا توجد خدمات تطابق بحثك.</p></td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default ServicesManagementPage;