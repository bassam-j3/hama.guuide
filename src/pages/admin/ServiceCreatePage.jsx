import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash, Save, ArrowRight, InfoCircle, Link45deg, Image as ImageIcon } from 'react-bootstrap-icons';
import { createService } from '../../api/services/serviceService';
import { fetchAllSections } from '../../api/services/sectionService';
import { uploadFile } from '../../api/services/fileService';
import { getImageUrl } from '../../api/axiosConfig';
import schemaService from '../../api/services/schemaService'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast'; // 🚀

const getPresentationOptions = (fieldType) => {
    const map = {
        String: [{ value: 'نص عادي', label: 'نص قصير' }, { value: 'نص طويل', label: 'نص طويل' }, { value: 'رابط', label: 'رابط (URL)' }, { value: 'لون', label: 'مُنتقي ألوان' }],
        Int: [{ value: 'رقم', label: 'مربع أرقام' }], Float: [{ value: 'رقم', label: 'مربع أرقام' }], Decimal: [{ value: 'رقم', label: 'مربع أرقام' }], Long: [{ value: 'رقم', label: 'مربع أرقام' }],
        Bool: [{ value: 'زر تفعيل', label: 'زر تفعيل (Switch)' }],
        Date: [{ value: 'تاريخ', label: 'تاريخ' }], DateTime: [{ value: 'تاريخ ووقت', label: 'تاريخ ووقت' }], Timespan: [{ value: 'وقت', label: 'وقت' }],
        Email: [{ value: 'إيميل', label: 'بريد إلكتروني' }], PhoneNumber: [{ value: 'هاتف', label: 'رقم هاتف' }],
        Address: [{ value: 'خريطة', label: 'إحداثيات خريطة' }],
        Image: [{ value: 'صورة', label: 'رفع صورة' }], File: [{ value: 'ملف', label: 'رفع ملف' }],
        Enum: [{ value: 'قائمة', label: 'قائمة منسدلة' }], JSON: [{ value: 'كود', label: 'مربع نص (JSON)' }]
    };
    return map[fieldType] || [{ value: 'نص عادي', label: 'نص عادي' }];
};

const FIELD_TYPES = ["String", "Int", "DateTime", "Date", "Timespan", "Bool", "Float", "Enum", "Decimal", "Long", "Image", "File", "Email", "PhoneNumber", "Address", "JSON"];

const ServiceCreatePage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', description: '', slug: '', imageUrl: '', sectionId: '', schema: [] });
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const generateSlug = (text) => text?.toString().toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '') || "";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };
            if (name === 'title' && !prev.slugTouched && /^[a-zA-Z0-9\s]+$/.test(value)) updates.slug = generateSlug(value);
            if (name === 'slug') { updates.slugTouched = true; updates.slug = generateSlug(value); }
            return updates;
        });
    };

    useEffect(() => {
        const load = async () => { 
            try { 
                const data = await fetchAllSections();
                setSections(Array.isArray(data) ? data : (data?.items || data?.data || [])); 
            } catch (e) { 
                setLoadError('خطأ بالاتصال بالسيرفر.'); 
            } finally { 
                setLoading(false); 
            } 
        };
        load();
    }, []);

    const addField = () => setFormData(p => ({ ...p, schema: [...p.schema, { fieldName: "", fieldType: "String", isRequired: false, presentation: getPresentationOptions("String")[0].value }] }));
    const updateField = (i, k, v) => setFormData(p => { const s = [...p.schema]; s[i][k] = k === 'fieldName' ? v.replace(/\s+/g, '') : v; return { ...p, schema: s }; });
    const removeField = (i) => setFormData(p => ({ ...p, schema: p.schema.filter((_, idx) => idx !== i) }));
    
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading('جاري رفع الأيقونة...'); // 🚀
        try { 
            const result = await uploadFile(file);
            const finalUrl = result?.fileUrl || result;
            setFormData(prev => ({ ...prev, imageUrl: finalUrl })); 
            toast.success('تم رفع الأيقونة!', { id: toastId }); // 🚀
        } catch { 
            toast.error('فشل رفع الملف.', { id: toastId }); // 🚀
        } finally { 
            setUploading(false); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        const toastId = toast.loading('جاري إنشاء الخدمة والمخطط...'); // 🚀
        try {
            if (!formData.sectionId) throw new Error("اختر القسم.");
            if (!formData.slug || formData.slug.length < 3) throw new Error("الرابط يجب أن يكون إنجليزي وأطول من حرفين.");
            
            const cleanedSchema = formData.schema.filter(f => f.fieldName.trim() !== "").map(f => ({ ...f, presentation: f.presentation || getPresentationOptions(f.fieldType)[0].value, allowedTypes: null }));
            const created = await createService({ ...formData, slug: generateSlug(formData.slug), schema: cleanedSchema });
            
            if (cleanedSchema.length > 0 && (created?.id || created?.Id)) {
                await schemaService.saveSchema(created.id || created.Id, cleanedSchema).catch(console.warn);
            }
            
            toast.success('تم إنشاء الخدمة بنجاح!', { id: toastId }); // 🚀
            setTimeout(() => navigate('/admin/services'), 1500);
        } catch (err) { 
            toast.error(err.message || "فشل الحفظ.", { id: toastId }); // 🚀
        } finally { 
            setSubmitting(false); 
        }
    };

    if (loading) return <LoadingSpinner message="تحميل..." />;

    return (
        <div className="service-create-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h3 className="fw-bold mb-0">إنشاء خدمة جديدة</h3>
                <button className="btn btn-outline-secondary btn-sm w-100 w-md-auto" onClick={() => navigate('/admin/services')}><ArrowRight className="me-1"/> إلغاء</button>
            </div>
            
            {loadError && <ErrorMessage message={loadError} />}
            
            <form onSubmit={handleSubmit} className="row g-3 g-md-4">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 h-100">
                        <h6 className="fw-bold mb-4 text-success border-bottom pb-2"><InfoCircle className="me-1"/> أساسيات</h6>
                        <div className="mb-3">
                            <label className="form-label fw-bold small">القسم المرتبط <span className="text-danger">*</span></label>
                            <select className="form-select" name="sectionId" value={formData.sectionId} onChange={handleChange} required>
                                <option value="">-- اختر القسم --</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select>
                        </div>
                        <div className="row g-2 mb-3">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-bold small">اسم الخدمة</label>
                                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} required />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-bold small">الرابط (Slug)</label>
                                <div className="input-group" dir="ltr">
                                    <span className="input-group-text bg-light border-end-0"><Link45deg/></span>
                                    <input type="text" className="form-control border-start-0 ps-0" name="slug" value={formData.slug} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>
                        <div className="mb-4 bg-light p-3 rounded border border-dashed text-center">
                            <label className="form-label fw-bold small d-block text-end mb-2">أيقونة</label>
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-white border rounded p-1 flex-shrink-0" style={{width: 50, height: 50}}>{formData.imageUrl ? <img src={getImageUrl(formData.imageUrl)} className="w-100 h-100 object-fit-cover"/> : <ImageIcon className="opacity-25 mt-1" size={20}/>}</div>
                                <input type="file" className="form-control form-control-sm" onChange={handleFileChange} accept="image/*" disabled={uploading}/>
                            </div>
                        </div>
                        <div className="mb-2">
                            <label className="form-label fw-bold small">الوصف</label>
                            <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                            <h6 className="fw-bold mb-0">⚙️ حقول النموذج</h6>
                            <button type="button" className="btn btn-primary btn-sm rounded-pill px-3" onClick={addField}>+ إضافة</button>
                        </div>
                        <div className="overflow-auto pe-1" style={{ maxHeight: '400px' }}>
                            {formData.schema.length === 0 && <p className="text-center text-muted py-4 small">أضف حقولاً مخصصة.</p>}
                            {formData.schema.map((field, index) => (
                                <div key={index} className="card mb-3 bg-light border-0 p-3 border-start border-4 border-primary shadow-sm">
                                    <div className="row g-2 mb-2">
                                        <div className="col-12 col-md-7">
                                            <input type="text" className="form-control form-control-sm" placeholder="اسم الحقل (إنجليزي)" value={field.fieldName} onChange={(e) => updateField(index, 'fieldName', e.target.value)} dir="ltr" required />
                                        </div>
                                        <div className="col-12 col-md-5 d-flex align-items-center justify-content-end">
                                            <div className="form-check form-switch mb-0">
                                                <input className="form-check-input" type="checkbox" checked={field.isRequired} onChange={e => updateField(index, 'isRequired', e.target.checked)} />
                                                <label className="form-check-label small fw-bold ms-2">مطلوب</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row g-2 align-items-end">
                                        <div className="col-6 col-md-5">
                                            <label className="form-label small text-muted mb-1">النوع</label>
                                            <select className="form-select form-select-sm" value={field.fieldType} onChange={(e) => { const nt = e.target.value; updateField(index, 'fieldType', nt); updateField(index, 'presentation', getPresentationOptions(nt)[0].value); }}>
                                                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-6 col-md-5">
                                            <label className="form-label small text-muted mb-1">العرض <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm border-primary" required value={field.presentation || getPresentationOptions(field.fieldType)[0].value} onChange={(e) => updateField(index, 'presentation', e.target.value)}>
                                                {getPresentationOptions(field.fieldType).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-2 mt-2 mt-md-0">
                                            <button type="button" className="btn btn-sm btn-outline-danger w-100" onClick={() => removeField(index)}><Trash /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-12">
                    <button type="submit" className="btn btn-success w-100 py-3 fw-bold shadow-sm" disabled={submitting || uploading}>
                        {submitting ? 'جاري الحفظ...' : 'حفظ وإنشاء الخدمة'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceCreatePage;