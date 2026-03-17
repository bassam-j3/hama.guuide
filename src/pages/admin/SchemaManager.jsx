import React, { useState } from 'react';
import { Gear, PlusCircle, Trash, CheckCircleFill } from 'react-bootstrap-icons';
import { Modal } from 'bootstrap';
import schemaService from '../../api/services/schemaService'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast'; 

import { useServices } from '../../hooks/api/useServices';
import { useAllSchemas, useSaveSchema } from '../../hooks/api/useSchemas';
import { useQueryClient } from '@tanstack/react-query';

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
    const queryClient = useQueryClient();
    const ALL_TYPES = ["String", "Int", "DateTime", "Date", "Timespan", "Bool", "Float", "Enum", "Decimal", "Long", "Image", "File", "Email", "PhoneNumber", "Address", "JSON"];

    const [selectedService, setSelectedService] = useState(null);
    const [fields, setFields] = useState([]);

    const { data: servicesData, isLoading: loadingServices, isError: errorServices } = useServices();
    const { data: schemasData, isLoading: loadingSchemas, isError: errorSchemas } = useAllSchemas();
    const saveMutation = useSaveSchema();

    // استخراج البيانات بشكل آمن
    const services = Array.isArray(servicesData) ? servicesData : (servicesData?.items || servicesData?.data || []);
    const schemas = Array.isArray(schemasData) ? schemasData : (schemasData?.schemas || []); 

    const isLoading = loadingServices || loadingSchemas;
    const hasError = errorServices || errorSchemas;

    // دالة إغلاق المودال 
    const handleCloseModal = () => {
        const modalEl = document.getElementById('schemaModal');
        if (modalEl) {
            const modal = Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        // تنظيف إضافي لضمان عدم وجود أي بقايا
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
    };

    const handleOpenModal = async (service) => {
        setSelectedService(service); 
        setFields([]); 

        // 🚀 فتح المودال مع منع تكوين الشاشة السوداء (backdrop: false)
        const modalEl = document.getElementById('schemaModal');
        if (modalEl) {
            const modal = Modal.getOrCreateInstance(modalEl, { backdrop: false });
            modal.show();
        }

        try {
            const res = await queryClient.fetchQuery({
                queryKey: ['schema', service.id],
                queryFn: () => schemaService.getSchemaByService(service.id)
            });
            
            const existing = res?.schema || res || []; 
            if (Array.isArray(existing) && existing.length > 0) {
                setFields(existing.map(f => ({ 
                    ...f, 
                    id: crypto.randomUUID(), 
                    presentation: f.presentation || f.Presentation || getPresentationOptions(f.fieldType || 'String')[0].value 
                })));
            } else {
                setFields([{ id: crypto.randomUUID(), fieldName: "", isRequired: false, fieldType: "String", presentation: "نص عادي" }]);
            }
        } catch { 
            setFields([{ id: crypto.randomUUID(), fieldName: "", isRequired: false, fieldType: "String", presentation: "نص عادي" }]); 
        }
    };

    const handleSave = async () => {
        if (!selectedService) return;
        if (!fields.every(f => f.fieldName.trim() !== '' && f.presentation)) {
            toast.error("يرجى ملء جميع الحقول الإجبارية!"); 
            return;
        }
        
        const payloadFields = fields.map(f => ({ 
            ...f, 
            fieldName: f.fieldName.trim(), 
            presentation: f.presentation || getPresentationOptions(f.fieldType)[0].value, 
            allowedTypes: null 
        }));

        saveMutation.mutate(
            { serviceId: selectedService.id, fields: payloadFields },
            {
                onSuccess: () => {
                    handleCloseModal(); 
                }
            }
        );
    };

    if (isLoading) return <LoadingSpinner message="جاري التحميل..." />;

    return (
        <div className="schema-manager animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1">إدارة المخططات</h3>
                    <p className="text-muted small mb-0">الحقول الديناميكية للخدمات.</p>
                </div>
                <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                    <Gear size={24} />
                </div>
            </div>

            {hasError && <ErrorMessage message="فشل جلب البيانات." />}

            {!hasError && (
                <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary small text-uppercase">
                                <tr>
                                    <th className="py-3 px-3 px-md-4">اسم الخدمة</th>
                                    <th className="py-3 d-none d-md-table-cell">حالة المخطط</th>
                                    <th className="text-center py-3">التحكم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(s => {
                                    const hasSchema = schemas.some(x => x.serviceId === s.id);
                                    return (
                                        <tr key={s.id}>
                                            <td className="fw-bold text-dark px-3 px-md-4">
                                                {s.title} {hasSchema && <CheckCircleFill className="ms-2 text-success d-inline-block d-md-none" size={14}/>}
                                            </td>
                                            <td className="d-none d-md-table-cell">
                                                {hasSchema ? <span className="badge bg-success-subtle text-success border border-success px-3">مضبوط</span> : <span className="badge bg-light text-muted border px-3">فارغ</span>}
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-outline-primary btn-sm px-3 px-md-4 shadow-sm fw-bold" onClick={() => handleOpenModal(s)}>
                                                    تعديل
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: تمت إضافة data-bs-backdrop="false" لمنع الخلفية السوداء */}
            <div className="modal fade" id="schemaModal" tabIndex="-1" aria-hidden="true" data-bs-backdrop="false">
                {/* تم إضافة shadow-lg للمودال لكي يبرز فوق الصفحة بما أننا أزلنا الخلفية المظلمة */}
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-md-down">
                    <div className="modal-content border-0 shadow-lg" style={{boxShadow: '0 1rem 3rem rgba(0,0,0,0.175)'}}>
                        <div className="modal-header bg-light border-bottom">
                            <h5 className="modal-title fw-bold text-primary"><Gear className="me-2 mb-1"/> {selectedService?.title}</h5>
                            <button type="button" className="btn-close ms-0 me-auto" onClick={handleCloseModal}></button>
                        </div>
                        <div className="modal-body bg-white p-3 p-md-4">
                            <div className="fields-container overflow-x-hidden pe-1">
                                {fields.map((field, index) => (
                                    <div className="card mb-3 border-0 shadow-sm border-start border-4 border-primary bg-light" key={field.id || index}>
                                        <div className="card-body p-3">
                                            {/* 🚀 تصميم متجاوب (Responsive) أفضل بكثير */}
                                            <div className="row g-3 align-items-end">
                                                
                                                <div className="col-12 col-md-4 col-lg-3">
                                                    <label className="small fw-bold mb-1 text-secondary">اسم الحقل (بالانجليزية)</label>
                                                    <input 
                                                        type="text" 
                                                        className="form-control border-0 shadow-sm" 
                                                        value={field.fieldName} 
                                                        dir="ltr" 
                                                        onChange={e => { const t = [...fields]; t[index].fieldName = e.target.value.replace(/\s+/g, ''); setFields(t); }} 
                                                        required 
                                                        placeholder="مثال: phoneNumber" 
                                                    />
                                                </div>

                                                <div className="col-6 col-md-4 col-lg-3">
                                                    <label className="small fw-bold mb-1 text-secondary">نوع البيانات</label>
                                                    <select 
                                                        className="form-select border-0 shadow-sm" 
                                                        value={field.fieldType} 
                                                        onChange={e => { const t = [...fields]; t[index].fieldType = e.target.value; t[index].presentation = getPresentationOptions(e.target.value)[0].value; setFields(t); }}
                                                    >
                                                        {ALL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                                    </select>
                                                </div>

                                                <div className="col-6 col-md-4 col-lg-3">
                                                    <label className="small fw-bold mb-1 text-secondary">طريقة العرض <span className="text-danger">*</span></label>
                                                    <select 
                                                        className="form-select border-0 shadow-sm text-primary fw-bold" 
                                                        required 
                                                        value={field.presentation || getPresentationOptions(field.fieldType)[0].value} 
                                                        onChange={e => { const t = [...fields]; t[index].presentation = e.target.value; setFields(t); }}
                                                    >
                                                        {getPresentationOptions(field.fieldType).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                </div>

                                                <div className="col-9 col-md-8 col-lg-2 mt-3 mt-lg-0">
                                                    {/* 🚀 تصميم أفضل للـ Switch */}
                                                    <div className="form-check form-switch mb-0 w-100 bg-white border border-light-subtle rounded p-2 d-flex justify-content-between align-items-center shadow-sm" style={{minHeight: '38px'}}>
                                                        <label className="small fw-bold cursor-pointer mb-0 text-dark" htmlFor={`req-${index}`}>إجباري؟</label>
                                                        <input 
                                                            className="form-check-input m-0 cursor-pointer" 
                                                            type="checkbox" 
                                                            checked={field.isRequired} 
                                                            onChange={e => { const t = [...fields]; t[index].isRequired = e.target.checked; setFields(t); }} 
                                                            id={`req-${index}`} 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-3 col-md-4 col-lg-1 mt-3 mt-lg-0">
                                                    <button 
                                                        className="btn btn-danger w-100 shadow-sm d-flex justify-content-center align-items-center" 
                                                        style={{minHeight: '38px'}}
                                                        title="حذف الحقل" 
                                                        onClick={() => setFields(fields.filter((_, i) => i !== index))}
                                                    >
                                                        <Trash size={18}/>
                                                    </button>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className="btn btn-outline-primary w-100 py-3 fw-bold mt-2 border-2 border-dashed bg-primary bg-opacity-10" onClick={() => setFields([...fields, { id: crypto.randomUUID(), fieldName: "", isRequired: false, fieldType: "String", presentation: "نص عادي" }])}>
                                <PlusCircle className="ms-2 mb-1" /> إضافة حقل جديد
                            </button>
                        </div>
                        <div className="modal-footer border-0 bg-light p-3 p-md-4">
                            <button className="btn btn-secondary w-100 w-md-auto mb-2 mb-md-0" onClick={handleCloseModal}>إلغاء</button>
                            <button className="btn btn-success w-100 w-md-auto px-5 fw-bold shadow" onClick={handleSave} disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? 'يتم الحفظ...' : 'حفظ المخطط'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SchemaManager;