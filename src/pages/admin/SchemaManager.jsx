import React, { useState, useEffect, useCallback } from 'react';
import { Gear, PlusCircle, Trash, Save, CheckCircleFill, InfoCircle } from 'react-bootstrap-icons';
import { Modal } from 'bootstrap';
import { fetchAllServices } from '../../api/services/serviceService';
import schemaService from '../../api/services/schemaService'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast'; // 🚀 استيراد التوست

const getPresentationOptions = (fieldType) => {
    const map = {
        String: [{ value: 'نص عادي', label: 'نص قصير' }, { value: 'نص طويل', label: 'نص طويل' }, { value: 'رابط', label: 'رابط' }, { value: 'لون', label: 'لون' }],
        Int: [{ value: 'رقم', label: 'أرقام' }], Float: [{ value: 'رقم', label: 'أرقام' }], Decimal: [{ value: 'رقم', label: 'أرقام' }], Long: [{ value: 'رقم', label: 'أرقام' }],
        Bool: [{ value: 'زر تفعيل', label: 'تفعيل' }], Date: [{ value: 'تاريخ', label: 'تاريخ' }], DateTime: [{ value: 'تاريخ ووقت', label: 'تاريخ ووقت' }], Timespan: [{ value: 'وقت', label: 'وقت' }],
        Email: [{ value: 'إيميل', label: 'إيميل' }], PhoneNumber: [{ value: 'هاتف', label: 'هاتف' }], Address: [{ value: 'خريطة', label: 'خريطة' }],
        Image: [{ value: 'صورة', label: 'صورة' }], File: [{ value: 'ملف', label: 'ملف' }], Enum: [{ value: 'قائمة', label: 'قائمة' }], JSON: [{ value: 'كود', label: 'JSON' }]
    };
    return map[fieldType] || [{ value: 'نص عادي', label: 'نص عادي' }];
};

const SchemaManager = () => {
    const [services, setServices] = useState([]);
    const [schemas, setSchemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [fields, setFields] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const ALL_TYPES = ["String", "Int", "DateTime", "Date", "Timespan", "Bool", "Float", "Enum", "Decimal", "Long", "Image", "File", "Email", "PhoneNumber", "Address", "JSON"];

    const loadData = useCallback(async () => {
        try { setLoading(true); setError(null); const [resServices, resSchemas] = await Promise.all([fetchAllServices(), schemaService.getAllSchemas()]); setServices(resServices || []); setSchemas(resSchemas?.schemas || resSchemas || []); } 
        catch (err) { setError("فشل الجلب."); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleOpenModal = async (service) => {
        setSelectedService(service); setFields([]); 
        try {
            const res = await schemaService.getSchemaByService(service.id);
            const existing = res?.schema || res || []; 
            if (Array.isArray(existing) && existing.length > 0) setFields(existing.map(f => ({ ...f, presentation: f.presentation || f.Presentation || getPresentationOptions(f.fieldType || 'String')[0].value })));
            else setFields([{ fieldName: "", isRequired: false, fieldType: "String", presentation: "نص عادي" }]);
        } catch { setFields([{ fieldName: "", isRequired: false, fieldType: "String", presentation: "نص عادي" }]); }
    };

    const handleSave = async () => {
        if (!selectedService) return;
        if (!fields.every(f => f.fieldName.trim() !== '' && f.presentation)) {
            toast.error("يرجى ملء جميع الحقول الإجبارية!"); // 🚀 استخدام توست
            return;
        }
        
        const toastId = toast.loading("جاري حفظ المخطط..."); // 🚀 توست التحميل
        setSubmitting(true);
        try {
            await schemaService.saveSchema(selectedService.id, fields.map(f => ({ ...f, fieldName: f.fieldName.trim(), presentation: f.presentation || getPresentationOptions(f.fieldType)[0].value, allowedTypes: null })));
            Modal.getInstance(document.getElementById('schemaModal'))?.hide();
            await loadData(); 
            toast.success("تم تحديث المخطط بنجاح!", { id: toastId }); // 🚀 توست النجاح
        } catch (err) { 
            toast.error("فشل الحفظ. تأكد من توافق البيانات.", { id: toastId }); // 🚀 توست الخطأ
        } finally { setSubmitting(false); }
    };

    if (loading) return <LoadingSpinner message="جاري التحميل..." />;

    return (
        <div className="schema-manager animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div><h3 className="fw-bold mb-1">إدارة المخططات</h3><p className="text-muted small mb-0">الحقول الديناميكية للخدمات.</p></div>
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><Gear size={24} /></div>
            </div>
            {error && <ErrorMessage message={error} onRetry={loadData} />}
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-dark text-white"><tr><th className="py-3 px-3 px-md-4">اسم الخدمة</th><th className="py-3 d-none d-md-table-cell">حالة المخطط</th><th className="text-center py-3">التحكم</th></tr></thead>
                        <tbody>
                            {services.map(s => {
                                const hasSchema = schemas.some(x => x.serviceId === s.id);
                                return (
                                    <tr key={s.id}>
                                        <td className="fw-bold text-dark px-3 px-md-4">{s.title} {hasSchema ? <CheckCircleFill className="ms-1 text-success d-inline-block d-md-none" size={14}/> : ''}</td>
                                        <td className="d-none d-md-table-cell">{hasSchema ? <span className="badge bg-success-subtle text-success border border-success px-3">مضبوط</span> : <span className="badge bg-light text-muted border px-3">فارغ</span>}</td>
                                        <td className="text-center"><button className="btn btn-outline-primary btn-sm px-3 px-md-4 shadow-sm" onClick={() => handleOpenModal(s)} data-bs-toggle="modal" data-bs-target="#schemaModal">تعديل</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="modal fade" id="schemaModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-md-down">
                    <div className="modal-content border-0 shadow-lg">
                        <div className="modal-header bg-dark text-white"><h5 className="modal-title"><Gear className="me-2"/> {selectedService?.title}</h5><button type="button" className="btn-close btn-close-white ms-0 me-auto" data-bs-dismiss="modal"></button></div>
                        <div className="modal-body bg-light p-3 p-md-4">
                            <div className="fields-container overflow-auto pe-1" style={{ maxHeight: '60vh' }}>
                                {fields.map((field, index) => (
                                    <div className="card mb-3 border-0 shadow-sm border-start border-4 border-primary" key={index}>
                                        <div className="card-body p-3">
                                            <div className="row g-2 align-items-end">
                                                <div className="col-12 col-md-3"><label className="small fw-bold mb-1">اسم الحقل</label><input type="text" className="form-control form-control-sm" value={field.fieldName} dir="ltr" onChange={e => { const t = [...fields]; t[index].fieldName = e.target.value.replace(/\s+/g, ''); setFields(t); }} required /></div>
                                                <div className="col-6 col-md-3"><label className="small fw-bold mb-1">نوع البيانات</label><select className="form-select form-select-sm" value={field.fieldType} onChange={e => { const t = [...fields]; t[index].fieldType = e.target.value; t[index].presentation = getPresentationOptions(e.target.value)[0].value; setFields(t); }}>{ALL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                                                <div className="col-6 col-md-3"><label className="small fw-bold mb-1">العرض <span className="text-danger">*</span></label><select className="form-select form-select-sm border-primary" required value={field.presentation || getPresentationOptions(field.fieldType)[0].value} onChange={e => { const t = [...fields]; t[index].presentation = e.target.value; setFields(t); }}>{getPresentationOptions(field.fieldType).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                                                <div className="col-10 col-md-2 mt-2 mt-md-0 text-md-center"><div className="form-check form-switch d-inline-block mb-0"><input className="form-check-input" type="checkbox" checked={field.isRequired} onChange={e => { const t = [...fields]; t[index].isRequired = e.target.checked; setFields(t); }} /><label className="small fw-bold ms-2">إجباري</label></div></div>
                                                <div className="col-2 col-md-1 mt-2 mt-md-0"><button className="btn btn-sm btn-outline-danger w-100 px-1" onClick={() => setFields(fields.filter((_, i) => i !== index))}><Trash/></button></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-outline-primary w-100 py-2 fw-bold mt-3 border-2 border-dashed" onClick={() => setFields([...fields, { fieldName: "", isRequired: false, fieldType: "String", presentation: "نص عادي" }])}><PlusCircle className="ms-2" /> حقل جديد</button>
                        </div>
                        <div className="modal-footer border-0 bg-light p-3 p-md-4"><button className="btn btn-light w-100 w-md-auto mb-2 mb-md-0" data-bs-dismiss="modal">إلغاء</button><button className="btn btn-success w-100 w-md-auto px-5 fw-bold shadow-sm" onClick={handleSave} disabled={submitting}>{submitting ? 'يتم الحفظ...' : 'حفظ المخطط'}</button></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SchemaManager;