import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CloudUpload, ArrowRight, Save, InfoCircle, Image as ImageIcon, GeoAltFill, Type } from 'react-bootstrap-icons';
import { fetchAllServices } from '../../api/services/serviceService';
import { uploadFile } from '../../api/services/fileService';
import { useCreatePost } from '../../hooks/api/usePosts';
import axiosInstance, { getImageUrl } from '../../api/axiosConfig'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import LocationPicker from '../../components/common/LocationPicker';

const PostCreatePage = () => {
    const { serviceSlug } = useParams();
    const navigate = useNavigate();
    const createPostMutation = useCreatePost(serviceSlug);

    const [coreData, setCoreData] = useState({ 
        title: '', 
        imageUrl: '', 
        latitude: null, 
        longitude: null, 
        addressDisplay: '' 
    });
    
    const [payloadData, setPayloadData] = useState({});
    const [serviceInfo, setServiceInfo] = useState(null);
    const [schema, setSchema] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false); 
    const [uploadingField, setUploadingField] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    const initPage = useCallback(async () => {
        try {
            setLoading(true);
            const services = await fetchAllServices();
            const currentService = services.find(s => s.slug === serviceSlug);
            if (!currentService) throw new Error(`الخدمة غير موجودة.`);

            let realSchema = [];
            try {
                const schemaRes = await axiosInstance.get(`/Schemas/${currentService.id}`);
                if (Array.isArray(schemaRes)) realSchema = schemaRes;
                else if (schemaRes.schema) realSchema = schemaRes.schema;
                else if (schemaRes.types) realSchema = schemaRes.types;
            } catch {
                if (currentService.schema) realSchema = currentService.schema;
            }

            const filteredSchema = realSchema.map(field => ({
                fieldName: field.fieldName || field.FieldName,
                fieldType: field.fieldType || field.FieldType || "String",
                isRequired: field.isRequired || field.IsRequired || false,
                presentation: field.presentation || field.Presentation || "نص عادي" // ✅ Fallback arabic
            })).filter(f => {
                const name = f.fieldName.toLowerCase();
                return !name.includes('location') && !name.includes('lat') && !name.includes('long') && name !== 'address';
            });

            setSchema(filteredSchema);
            setServiceInfo({ ...currentService });
            
            const initialPayload = {};
            filteredSchema.forEach(f => initialPayload[f.fieldName] = f.fieldType === 'Bool' ? false : "");
            setPayloadData(initialPayload);

        } catch {
            setStatus({ type: 'danger', message: 'فشل تحميل بيانات الخدمة.' });
        } finally {
            setLoading(false);
        }
    }, [serviceSlug]);

    useEffect(() => { initPage(); }, [initPage]);

    const handleCoreImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadFile(file);
            setCoreData(p => ({ ...p, imageUrl: res.fileUrl || res }));
        } catch {
            setStatus({ type: 'danger', message: "فشل رفع الصورة الأساسية." });
        } finally {
            setUploading(false);
        }
    };

    const handleDynamicFileUpload = async (key, file) => {
        if (!file) return;
        setUploadingField(key);
        try {
            const res = await uploadFile(file);
            setPayloadData(p => ({ ...p, [key]: res.fileUrl || res }));
        } catch {
            setStatus({ type: 'danger', message: "فشل رفع الملف." });
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (!coreData.title) return setStatus({ type: 'danger', message: 'العنوان مطلوب.' });
        if (!coreData.imageUrl) return setStatus({ type: 'danger', message: 'الصورة الأساسية مطلوبة.' });
        if (coreData.latitude === null || coreData.longitude === null) return setStatus({ type: 'danger', message: 'يرجى تحديد الموقع على الخريطة.' });

        setSubmitting(true);
        try {
            const cleanedPayload = { ...payloadData };
            schema.forEach((field) => {
                const val = cleanedPayload[field.fieldName];
                if (field.fieldType === 'Int') cleanedPayload[field.fieldName] = parseInt(val) || 0;
                if (field.fieldType === 'Float' || field.fieldType === 'Decimal' || field.fieldType === 'Long') {
                    cleanedPayload[field.fieldName] = parseFloat(val) || 0;
                }
            });

            const body = {
                title: coreData.title,
                imageUrl: coreData.imageUrl,
                latitude: parseFloat(coreData.latitude),
                longitude: parseFloat(coreData.longitude),
                payload: cleanedPayload
            };

            await createPostMutation.mutateAsync(body);
            setStatus({ type: 'success', message: 'تم النشر بنجاح!' });
            setTimeout(() => navigate(`/admin/posts/${serviceSlug}`), 1500);

        } catch (err) {
            const errorMsg = err.response?.data?.Errors?.[0]?.description || "فشل الحفظ.";
            setStatus({ type: 'danger', message: errorMsg });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="جاري التحميل..." />;

    return (
        <div className="post-create animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-1">إضافة: {serviceInfo?.title}</h3>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/admin/posts/${serviceSlug}`)}>
                    <ArrowRight /> عودة
                </button>
            </div>
            {status.message && <ErrorMessage message={status.message} variant={status.type} />}

            <form onSubmit={handleSubmit} className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 rounded-3 mb-4">
                        <h6 className="fw-bold mb-3 text-primary border-bottom pb-2">البيانات الأساسية</h6>
                        <div className="mb-4">
                            <label className="form-label fw-bold small"><Type className="me-1"/> عنوان البوست <span className="text-danger">*</span></label>
                            <input type="text" className="form-control form-control-lg" value={coreData.title} onChange={e => setCoreData({...coreData, title: e.target.value})} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold small"><GeoAltFill className="me-1"/> الموقع على الخريطة <span className="text-danger">*</span></label>
                            <div className="border rounded p-2 bg-light">
                                <LocationPicker 
                                    value={{ lat: coreData.latitude || 0, lng: coreData.longitude || 0 }}
                                    onChange={({ lat, lng, address: addr }) => setCoreData(p => ({...p, latitude: lat, longitude: lng, addressDisplay: addr}))}
                                />
                                <div className="mt-2">
                                    {coreData.latitude ? (
                                        <div className="p-2 bg-white border border-success rounded text-success fw-bold small d-flex align-items-center">
                                            <GeoAltFill className="me-2 flex-shrink-0" />
                                            <span className="text-truncate">
                                                {coreData.addressDisplay || `الإحداثيات: (${coreData.latitude.toFixed(5)}, ${coreData.longitude.toFixed(5)})`}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-white border border-dashed rounded text-muted small">
                                            لم يتم تحديد الموقع بعد...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {schema.length > 0 && (
                        <div className="card border-0 shadow-sm p-4 rounded-3 mb-4">
                            <h6 className="fw-bold mb-3 text-success border-bottom pb-2"><InfoCircle className="me-2" /> تفاصيل إضافية</h6>
                            {schema.map(field => {
                                // معالجة رفع الملفات والصور
                                if (field.fieldType === 'Image' || field.fieldType === 'File' || field.presentation === 'صورة' || field.presentation === 'ملف') {
                                    return (
                                        <div key={field.fieldName} className="mb-4 bg-light p-3 rounded border border-dashed">
                                            <label className="form-label small fw-bold mb-2">{field.fieldName} {field.isRequired && <span className="text-danger">*</span>}</label>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-white border rounded p-1" style={{width: 60, height: 60, overflow: 'hidden'}}>
                                                    {payloadData[field.fieldName] ? (
                                                        field.fieldType === 'Image' || field.presentation === 'صورة' ? 
                                                        <img src={getImageUrl(payloadData[field.fieldName])} className="w-100 h-100 object-fit-cover rounded" /> 
                                                        : <div className="d-flex align-items-center justify-content-center h-100 fw-bold text-success">✓</div>
                                                    ) : <ImageIcon className="opacity-25" size={24} />}
                                                </div>
                                                <input type="file" id={`f-${field.fieldName}`} className="d-none" onChange={e => handleDynamicFileUpload(field.fieldName, e.target.files[0])} />
                                                <label htmlFor={`f-${field.fieldName}`} className="btn btn-outline-primary btn-sm px-3 cursor-pointer">
                                                    {uploadingField === field.fieldName ? "جاري الرفع..." : "رفع"}
                                                </label>
                                            </div>
                                        </div>
                                    );
                                }

                                const presentationType = field.presentation || 'نص عادي';

                                return (
                                    <div key={field.fieldName} className="mb-3">
                                        <label className="form-label small fw-bold">{field.fieldName} {field.isRequired && <span className="text-danger">*</span>}</label>
                                        
                                        {(() => {
                                            // 1. زر التفعيل
                                            if (field.fieldType === 'Bool' || presentationType === 'زر تفعيل') {
                                                return (
                                                    <div className="form-check form-switch">
                                                        <input className="form-check-input" type="checkbox" checked={!!payloadData[field.fieldName]} onChange={e => setPayloadData(p => ({...p, [field.fieldName]: e.target.checked}))} />
                                                    </div>
                                                );
                                            }
                                            
                                            // 2. النص الطويل
                                            if (presentationType === 'نص طويل' || presentationType === 'كود') {
                                                return (
                                                    <textarea className="form-control shadow-none" rows="4" required={field.isRequired} value={payloadData[field.fieldName] || ''} onChange={e => setPayloadData(p => ({...p, [field.fieldName]: e.target.value}))} dir={presentationType === 'كود' ? 'ltr' : 'rtl'} />
                                                );
                                            }

                                            // 3. الألوان
                                            if (presentationType === 'لون') {
                                                return (
                                                    <input type="color" className="form-control form-control-color shadow-none" required={field.isRequired} value={payloadData[field.fieldName] || '#000000'} onChange={e => setPayloadData(p => ({...p, [field.fieldName]: e.target.value}))} />
                                                );
                                            }

                                            // 4. تحديد نوع الإدخال (Input Type) المناسب للكلمة العربية
                                            let inputType = 'text';
                                            if (presentationType === 'رقم') inputType = 'number';
                                            else if (presentationType === 'رابط') inputType = 'url';
                                            else if (presentationType === 'إيميل') inputType = 'email';
                                            else if (presentationType === 'تاريخ') inputType = 'date';
                                            else if (presentationType === 'تاريخ ووقت') inputType = 'datetime-local';
                                            else if (presentationType === 'وقت') inputType = 'time';
                                            else if (presentationType === 'هاتف') inputType = 'tel';

                                            return (
                                                <input 
                                                    type={inputType} 
                                                    className="form-control shadow-none" 
                                                    required={field.isRequired} 
                                                    value={payloadData[field.fieldName] || ''} 
                                                    onChange={e => setPayloadData(p => ({...p, [field.fieldName]: e.target.value}))} 
                                                    dir={inputType === 'url' || inputType === 'email' || inputType === 'tel' ? 'ltr' : 'rtl'}
                                                />
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 rounded-3 mb-4 text-center">
                        <label className="form-label fw-bold small mb-3"><ImageIcon className="me-1"/> الصورة الرئيسية <span className="text-danger">*</span></label>
                        <div className="bg-light border border-2 border-dashed rounded-3 p-3 position-relative d-flex align-items-center justify-content-center" style={{minHeight: '200px'}}>
                            {coreData.imageUrl ? (
                                <div className="position-relative w-100">
                                    <img src={getImageUrl(coreData.imageUrl)} className="img-fluid rounded shadow-sm" style={{maxHeight: '180px', objectFit: 'cover'}} />
                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 start-0 m-2 rounded-circle" onClick={() => setCoreData(p => ({...p, imageUrl: ''}))}>&times;</button>
                                </div>
                            ) : (
                                <div className="text-muted">
                                    {uploading ? <LoadingSpinner size="sm" message="رفع..."/> : <><ImageIcon size={32} className="mb-2 opacity-50"/><p className="small mb-2">اختر صورة</p><span className="btn btn-outline-primary btn-sm px-4 pointer-events-none">تصفح</span></>}
                                </div>
                            )}
                            <input type="file" className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" onChange={handleCoreImageUpload} accept="image/*" disabled={uploading} />
                        </div>
                    </div>
                    <div className="card border-0 shadow-sm p-4 rounded-3 bg-white">
                        <button type="submit" className="btn btn-success w-100 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" disabled={submitting || uploading}>
                            {submitting ? <LoadingSpinner size="sm" /> : <Save />} {submitting ? "جاري النشر..." : "نشر البوست"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
export default PostCreatePage;