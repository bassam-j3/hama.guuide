import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Save, Image as ImageIcon, Layers, Type, Link45deg } from 'react-bootstrap-icons';
import { createSection, fetchAllSections } from '../../api/services/sectionService';
import { uploadFile } from '../../api/services/fileService';
import { getImageUrl } from '../../api/axiosConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast'; // 🚀 استيراد Toasts

const SectionCreatePage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', slug: '', description: '', parentId: '', imageUrl: '' });
    const [allSections, setAllSections] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const loadSections = async () => {
            try {
                const data = await fetchAllSections();
                setAllSections(Array.isArray(data) ? data : []);
            } catch (err) { setLoadError("فشل تحميل قائمة الأقسام."); } finally { setLoading(false); }
        };
        loadSections();
    }, []);

    const hierarchicalOptions = useMemo(() => {
        const buildHierarchy = (sections, parentId = null, level = 0) => {
            let result = [];
            const children = sections.filter(s => s.parentId === parentId);
            for (const child of children) {
                result.push({ ...child, level });
                result = [...result, ...buildHierarchy(sections, child.id, level + 1)];
            }
            return result;
        };
        return buildHierarchy(allSections);
    }, [allSections]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };
            if (name === 'title' && !prev.slugTouched) {
                updates.slug = value.trim().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
            }
            return updates;
        });
    };

    const handleSlugChange = (e) => setFormData(prev => ({ ...prev, slug: e.target.value, slugTouched: true }));

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true); 
        const toastId = toast.loading('جاري رفع الصورة...'); // 🚀
        try {
            const res = await uploadFile(file);
            setFormData(prev => ({ ...prev, imageUrl: res.fileUrl || res }));
            toast.success('تم رفع الصورة بنجاح', { id: toastId }); // 🚀
        } catch (err) { 
            toast.error('فشل رفع الصورة.', { id: toastId }); // 🚀
        } finally { setUploading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); 
        const toastId = toast.loading('جاري إنشاء القسم...'); // 🚀
        try {
            const payload = { ...formData, parentId: formData.parentId === "" ? null : formData.parentId, imageUrl: formData.imageUrl || null };
            await createSection(payload);
            toast.success('تم إنشاء القسم بنجاح!', { id: toastId }); // 🚀
            navigate('/admin/sections');
        } catch (err) { 
            toast.error(err.response?.data?.message || "فشل إنشاء القسم.", { id: toastId }); // 🚀
        } finally { setSubmitting(false); }
    };

    if (loading) return <LoadingSpinner message="تحضير النموذج..." />;

    return (
        <div className="section-create animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إضافة قسم جديد</h3>
                    <p className="text-muted small mb-0">إنشاء قسم رئيسي أو فرعي في الهيكلية.</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm w-100 w-md-auto" onClick={() => navigate('/admin/sections')}><ArrowRight className="me-1" /> إلغاء</button>
            </div>

            {loadError && <ErrorMessage message={loadError} />}

            <form onSubmit={handleSubmit} className="row g-3 g-md-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold small text-secondary"><Type className="me-1"/> عنوان القسم <span className="text-danger">*</span></label>
                                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold small text-secondary">الرابط اللطيف (Slug)</label>
                                <div className="input-group" dir="ltr">
                                    <span className="input-group-text bg-light text-muted border-end-0"><Link45deg /></span>
                                    <input type="text" className="form-control border-start-0 ps-0" value={formData.slug} onChange={handleSlugChange} required />
                                </div>
                            </div>
                        </div>
                        <div className="mb-3 mt-3">
                            <label className="form-label fw-bold small text-secondary">الوصف</label>
                            <textarea className="form-control" rows="3" name="description" value={formData.description} onChange={handleChange}></textarea>
                        </div>
                        <div className="mb-2">
                            <label className="form-label fw-bold small text-secondary"><Layers className="me-1"/> يتبع للقسم (المستوى)</label>
                            <select className="form-select" name="parentId" value={formData.parentId} onChange={handleChange}>
                                <option value="" className="fw-bold">-- قسم رئيسي (Level 0) --</option>
                                {hierarchicalOptions.map(sec => <option key={sec.id} value={sec.id}>{'\u00A0\u00A0\u00A0'.repeat(sec.level)}{sec.level > 0 ? '└─ ' : ''}{sec.title}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 mb-3 text-center">
                        <label className="form-label fw-bold small text-secondary mb-3"><ImageIcon className="me-1"/> صورة القسم</label>
                        <div className="upload-box border border-2 border-dashed rounded-3 p-3 position-relative bg-light d-flex align-items-center justify-content-center" style={{minHeight: '150px'}}>
                            {formData.imageUrl ? (
                                <div className="position-relative w-100">
                                    <img src={getImageUrl(formData.imageUrl)} alt="Preview" className="img-fluid rounded shadow-sm" style={{maxHeight: '120px'}} />
                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 start-0 m-1 rounded-circle shadow-sm" style={{width: '24px', height: '24px', padding: 0}} onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))}>&times;</button>
                                </div>
                            ) : (
                                <div className="text-muted">
                                    {uploading ? <div className="spinner-border text-primary"></div> : <><p className="small mb-2">اختر صورة</p><span className="btn btn-sm btn-outline-primary">تصفح</span></>}
                                </div>
                            )}
                            <input type="file" className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" onChange={handleImageUpload} accept="image/*" disabled={uploading} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" disabled={submitting || uploading}>
                        {submitting ? <span className="spinner-border spinner-border-sm"></span> : <Save />} {submitting ? 'جاري الإنشاء...' : 'إنشاء القسم'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default SectionCreatePage;