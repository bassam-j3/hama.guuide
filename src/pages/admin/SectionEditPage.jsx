import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { getSectionById, updateSection, fetchAllSections } from '../../api/services/sectionService';
import { uploadFile } from '../../api/services/fileService'; 
import { getImageUrl } from '../../api/axiosConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Save, ArrowRight, Image as ImageIcon, Link45deg, Collection, PlusCircle, Trash, Gear } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

// 🚀 استيراد هوكات الخدمات وربط الأقسام
import { useServices } from '../../hooks/api/useServices';
import { useSectionServices, useLinkServiceToSection, useRemoveServiceFromSection } from '../../hooks/api/useSections';

const SectionEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { triggerGlobalRefresh } = useOutletContext(); 

    // حالة فورم القسم الأساسي
    const [formData, setFormData] = useState({ title: '', slug: '', description: '', imageUrl: '', parentId: '' });
    const [allSections, setAllSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    // حالة اختيار خدمة جديدة لربطها
    const [selectedServiceToLink, setSelectedServiceToLink] = useState('');

    // 🚀 React Query Hooks للميزات الجديدة
    const { data: allServicesData, isLoading: loadingAllServices } = useServices();
    const { data: linkedServicesData, isLoading: loadingLinkedServices } = useSectionServices(id);
    const linkMutation = useLinkServiceToSection();
    const unlinkMutation = useRemoveServiceFromSection();

    // تجهيز مصفوفات الخدمات
    const allServices = Array.isArray(allServicesData) ? allServicesData : (allServicesData?.items || allServicesData?.data || []);
    const linkedServices = Array.isArray(linkedServicesData) ? linkedServicesData : (linkedServicesData?.items || linkedServicesData?.data || []);

    // 💡 فلترة الخدمات: إخفاء الخدمات المرتبطة مسبقاً من القائمة المنسدلة
    const availableServicesToLink = useMemo(() => {
        return allServices.filter(service => !linkedServices.some(linked => linked.id === service.id));
    }, [allServices, linkedServices]);

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [sectionData, sectionsList] = await Promise.all([getSectionById(id), fetchAllSections()]);
            setFormData({
                title: sectionData.title || '', slug: sectionData.slug || '', description: sectionData.description || '',
                imageUrl: sectionData.imageUrl || '', parentId: sectionData.parentId || ''
            });
            setAllSections(Array.isArray(sectionsList) ? sectionsList : (sectionsList?.items || []));
        } catch (err) { setLoadError('فشل جلب البيانات.'); } finally { setLoading(false); }
    }, [id]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const hierarchicalOptions = useMemo(() => {
        const buildHierarchy = (sections, parentId = null, level = 0) => {
            let result = [];
            const children = sections.filter(s => s.parentId === parentId);
            for (const child of children) {
                if (child.id !== id) { 
                    result.push({ ...child, level });
                    result = [...result, ...buildHierarchy(sections, child.id, level + 1)];
                }
            }
            return result;
        };
        return buildHierarchy(allSections);
    }, [allSections, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let newValue = value;
            if (name === 'slug') newValue = value.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF\-]+/g, '').replace(/\-\-+/g, '-');
            return { ...prev, [name]: newValue };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true); 
        const toastId = toast.loading('جاري رفع الصورة...');
        try {
            const result = await uploadFile(file);
            setFormData(prev => ({ ...prev, imageUrl: result.fileUrl || result }));
            toast.success('تم رفع الصورة!', { id: toastId }); 
        } catch (err) { 
            toast.error('فشل رفع الصورة.', { id: toastId }); 
        } finally { setUploading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); 
        const toastId = toast.loading('جاري حفظ التعديلات...'); 
        try {
            await updateSection(id, formData);
            toast.success('تم حفظ التعديلات بنجاح!', { id: toastId }); 
            triggerGlobalRefresh(); 
            setTimeout(() => navigate('/admin/sections'), 1500);
        } catch (err) { 
            toast.error('فشل حفظ التعديلات.', { id: toastId }); 
        } finally { setSubmitting(false); }
    };

    // 🚀 دوال الربط وفك الربط
    const handleLinkService = () => {
        if (!selectedServiceToLink) return toast.error('يرجى اختيار خدمة أولاً');
        linkMutation.mutate({ sectionId: id, serviceId: selectedServiceToLink }, {
            onSuccess: () => setSelectedServiceToLink('') // تصفير الاختيار بعد النجاح
        });
    };

    const handleUnlinkService = (serviceId, serviceTitle) => {
        if (window.confirm(`هل أنت متأكد من فك ارتباط خدمة "${serviceTitle}" من هذا القسم؟`)) {
            unlinkMutation.mutate({ sectionId: id, serviceId });
        }
    };

    if (loading) return <LoadingSpinner message="جاري جلب البيانات..." />;

    return (
        <div className="section-edit-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1">تعديل القسم</h3>
                    <p className="text-muted small mb-0">تحديث بيانات القسم والخدمات المرتبطة به.</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm w-100 w-md-auto" onClick={() => navigate('/admin/sections')}><ArrowRight className="me-1"/> عودة</button>
            </div>

            {loadError && <ErrorMessage message={loadError} />}

            <div className="row g-3 g-md-4 mb-4">
                <div className="col-lg-8">
                    <form onSubmit={handleSubmit} className="card border-0 shadow-sm p-3 p-md-4 rounded-3 h-100">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold small">العنوان</label>
                                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold small">الرابط الفريد (Slug)</label>
                                <div className="input-group" dir="ltr">
                                    <span className="input-group-text bg-light border-end-0"><Link45deg /></span>
                                    <input type="text" className="form-control border-start-0 ps-0" name="slug" value={formData.slug} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>
                        <div className="mb-3 mt-3">
                            <label className="form-label fw-bold small">الوصف</label>
                            <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleChange} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-secondary">القسم الأب (الترتيب يتم من شاشة إدارة الأقسام)</label>
                            <select className="form-select bg-light text-muted" name="parentId" value={formData.parentId} disabled>
                                <option value="">-- قسم رئيسي (الجذر) --</option>
                                {hierarchicalOptions.map(opt => <option key={opt.id} value={opt.id}>{'\u00A0\u00A0\u00A0'.repeat(opt.level)}{opt.level > 0 ? '└─ ' : ''}{opt.title}</option>)}
                            </select>
                        </div>
                        <div className="mt-auto d-flex justify-content-end">
                            <button type="submit" className="btn btn-success w-100 w-md-auto px-5 py-2" disabled={submitting || uploading}>
                                {submitting ? <LoadingSpinner size="sm"/> : <Save className="me-2"/>} حفظ تعديلات القسم
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="col-lg-4 text-center">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 h-100">
                        <label className="form-label fw-bold small mb-3 d-block">المعاينة البصرية</label>
                        <div className="mb-3 border rounded p-2 bg-light d-flex align-items-center justify-content-center" style={{ minHeight: '150px' }}>
                            {formData.imageUrl ? (
                                <img src={getImageUrl(formData.imageUrl)} alt="Current" className="img-fluid rounded shadow-sm" style={{ maxHeight: '120px', objectFit: 'cover' }} />
                            ) : (
                                <div className="text-muted small"><ImageIcon size={32} className="d-block mx-auto mb-2 opacity-25" /> لا توجد صورة</div>
                            )}
                        </div>
                        <input type="file" className="form-control form-control-sm" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                    </div>
                </div>
            </div>

            {/* 🚀 قسم إدارة الخدمات المربوطة (The New Feature) */}
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="card-header bg-white border-bottom p-3 p-md-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h5 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                        <Gear size={20} /> الخدمات التابعة لهذا القسم
                    </h5>
                    
                    {/* إضافة خدمة للقسم */}
                    <div className="d-flex gap-2 w-100 w-md-auto">
                        <select 
                            className="form-select form-select-sm border-primary" 
                            style={{ minWidth: '200px' }}
                            value={selectedServiceToLink} 
                            onChange={(e) => setSelectedServiceToLink(e.target.value)}
                            disabled={loadingAllServices || linkMutation.isPending}
                        >
                            <option value="">-- اختر خدمة لربطها --</option>
                            {availableServicesToLink.map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </select>
                        <button 
                            className="btn btn-primary btn-sm px-3 d-flex align-items-center gap-1"
                            onClick={handleLinkService}
                            disabled={!selectedServiceToLink || linkMutation.isPending}
                        >
                            {linkMutation.isPending ? <span className="spinner-border spinner-border-sm"/> : <PlusCircle />} ربط
                        </button>
                    </div>
                </div>

                <div className="card-body p-0">
                    {loadingLinkedServices ? (
                        <div className="text-center p-5"><LoadingSpinner size="md" message="جاري تحميل الخدمات..." /></div>
                    ) : linkedServices.length === 0 ? (
                        <div className="text-center text-muted p-5 bg-light">
                            <Collection size={40} className="mb-3 opacity-25" />
                            <h6>لا توجد أي خدمات مرتبطة بهذا القسم حالياً.</h6>
                            <p className="small mb-0">يمكنك ربط الخدمات من القائمة العلوية.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light text-secondary small text-uppercase">
                                    <tr>
                                        <th className="ps-4 py-3">اسم الخدمة</th>
                                        <th className="py-3">الرابط (Slug)</th>
                                        <th className="text-center py-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedServices.map(service => (
                                        <tr key={service.id}>
                                            <td className="ps-4 fw-bold text-dark d-flex align-items-center gap-2">
                                                <div className="bg-primary bg-opacity-10 text-primary rounded p-2"><Collection size={16}/></div>
                                                {service.title}
                                            </td>
                                            <td className="text-muted small" dir="ltr">{service.slug}</td>
                                            <td className="text-center">
                                                <button 
                                                    className="btn btn-outline-danger btn-sm px-3" 
                                                    title="فك الارتباط وإزالتها من القسم"
                                                    onClick={() => handleUnlinkService(service.id, service.title)}
                                                    disabled={unlinkMutation.isPending}
                                                >
                                                    <Trash /> فك الربط
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SectionEditPage;