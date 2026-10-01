import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowRight, InfoCircle, Image as ImageIcon, GeoAltFill, Type, ExclamationTriangle } from "react-bootstrap-icons";

import { fetchAllServices } from "../../api/services/serviceService";
import { getPostById } from "../../api/services/postService";
import { uploadFile } from "../../api/services/fileService";
import { useUpdatePost } from '../../hooks/api/usePosts';
import axiosInstance, { getImageUrl } from "../../api/axiosConfig";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import LocationPicker from '../../components/common/LocationPicker';

const PostEditPage = () => {
    const { serviceSlug, postId } = useParams(); 
    const navigate = useNavigate();
    const updatePostMutation = useUpdatePost(serviceSlug);

    const [coreData, setCoreData] = useState({ 
        title: "", 
        imageUrl: "", 
        latitude: 0, 
        longitude: 0, 
        addressDisplay: "" 
    });
    
    const [payloadData, setPayloadData] = useState({});
    const [serviceInfo, setServiceInfo] = useState(null);
    const [schema, setSchema] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [services, postData] = await Promise.all([
                fetchAllServices(),
                getPostById(serviceSlug, postId)
            ]);

            const currentService = services.find(s => s.slug === serviceSlug);
            if (!currentService) throw new Error(`الخدمة غير موجودة.`);

            let realSchema = [];
            try {
                const schemaRes = await axiosInstance.get(`/Schemas/${currentService.id}`);
                if (Array.isArray(schemaRes)) realSchema = schemaRes;
                else if (schemaRes.schema) realSchema = schemaRes.schema;
                else if (schemaRes.types) realSchema = schemaRes.types;
            } catch (e) {
                if (currentService.schema) realSchema = currentService.schema;
            }

            const filteredSchema = realSchema.map(field => ({
                fieldName: field.fieldName || field.FieldName,
                fieldType: field.fieldType || field.FieldType || "String",
                isRequired: field.isRequired || field.IsRequired || false,
                presentation: field.presentation || field.Presentation || "نص عادي" // ✅ Fallback arabic
            })).filter(f => {
                const n = f.fieldName.toLowerCase();
                return !n.includes('location') && !n.includes('lat') && !n.includes('long') && n !== 'address';
            });

            setSchema(filteredSchema);
            setServiceInfo(currentService);

            const initialPayload = {};
            filteredSchema.forEach(field => {
                const existingValue = postData.payload ? postData.payload[field.fieldName] : undefined;
                initialPayload[field.fieldName] = existingValue !== undefined ? existingValue : (field.fieldType === 'Bool' ? false : "");
            });

            setPayloadData(initialPayload);

            setCoreData({
                title: postData.title || "",
                imageUrl: postData.imageUrl || "",
                latitude: postData.latitude || 0,
                longitude: postData.longitude || 0,
                addressDisplay: ""
            });

        } catch (err) {
            setStatus({ type: 'danger', message: 'فشل تحميل بيانات البوست.' });
        } finally {
            setLoading(false);
        }
    }, [serviceSlug, postId]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const handleDynamicFileUpload = async (key, file) => {
        if (!file) return;
        setUploadingField(key);
        try {
            const res = await uploadFile(file);
            setPayloadData(p => ({ ...p, [key]: res.fileUrl || res }));
        } catch {
            setStatus({ type: 'danger', message: 'فشل الرفع.' });
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus({ type: '', message: '' });

        if (!coreData.title) return setStatus({ type: 'danger', message: 'العنوان مطلوب.' });

        try {
            const payloadToSend = { ...payloadData };
            schema.forEach((field) => {
                const val = payloadToSend[field.fieldName];
                if (val !== undefined && val !== "") {
                    if (field.fieldType === 'Int') payloadToSend[field.fieldName] = parseInt(val, 10);
                    else if (field.fieldType === 'Float' || field.fieldType === 'Decimal' || field.fieldType === 'Long') {
                        payloadToSend[field.fieldName] = parseFloat(val);
                    }
                }
            });

            const body = {
                title: coreData.title,
                payload: payloadToSend,
                latitude: parseFloat(coreData.latitude),
                longitude: parseFloat(coreData.longitude),
            };

            await updatePostMutation.mutateAsync({ postId, postData: body });
            setStatus({ type: 'success', message: 'تم التعديل بنجاح!' });
            setTimeout(() => navigate(`/admin/posts/${serviceSlug}`), 1000);

        } catch (err) {
            const errorMsg = err.response?.data?.Errors?.[0]?.description || "فشل التحديث.";
            setStatus({ type: 'danger', message: errorMsg });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="جاري التحميل..." />;

    return (
        <div className="post-edit animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div><h3 className="fw-bold mb-1 text-primary">تعديل المحتوى</h3></div>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}><ArrowRight /> عودة</button>
            </div>
            {status.message && <ErrorMessage message={status.message} variant={status.type} />}

            <form onSubmit={handleSubmit} className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 rounded-3 mb-4">
                        <div className="mb-4">
                            <label className="form-label fw-bold small text-secondary">العنوان الأساسي <span className="text-danger">*</span></label>
                            <input type="text" className="form-control form-control-lg border-2 shadow-none" value={coreData.title} onChange={(e) => setCoreData({...coreData, title: e.target.value})} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold small"><GeoAltFill className="me-1"/> الموقع على الخريطة</label>
                            
                            <div className="border rounded p-2 bg-light">
                                {(coreData.latitude !== 0 || coreData.longitude !== 0) ? (
                                    <LocationPicker 
                                        key={`loaded-${coreData.latitude}-${coreData.longitude}`}
                                        value={{ lat: coreData.latitude, lng: coreData.longitude }} 
                                        onChange={({ lat, lng, address: addr }) => setCoreData(p => ({...p, latitude: lat, longitude: lng, addressDisplay: addr}))}
                                    />
                                ) : (
                                    <LocationPicker 
                                        key="new"
                                        value={{ lat: 0, lng: 0 }} 
                                        onChange={({ lat, lng, address: addr }) => setCoreData(p => ({...p, latitude: lat, longitude: lng, addressDisplay: addr}))}
                                    />
                                )}

                                <div className="mt-2">
                                    {(coreData.latitude !== 0 || coreData.longitude !== 0) ? (
                                        <div className="p-2 bg-white border border-success rounded text-success fw-bold small d-flex align-items-center">
                                            <GeoAltFill className="me-2 flex-shrink-0" />
                                            <span className="text-truncate">
                                                {coreData.addressDisplay || `الإحداثيات المحفوظة: (${coreData.latitude.toFixed(5)}, ${coreData.longitude.toFixed(5)})`}
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
                        <div className="dynamic-fields bg-light p-4 rounded-3 border border-dashed mb-4">
                            <h6 className="text-muted fw-bold mb-4 d-flex align-items-center gap-2"><InfoCircle size={18} /> التفاصيل المخصصة</h6>
                            {schema.map((field) => {
                                // معالجة الصور والملفات
                                if (field.fieldType === 'Image' || field.fieldType === 'File' || field.presentation === 'صورة' || field.presentation === 'ملف') {
                                    return (
                                        <div key={field.fieldName} className="mb-4 bg-white p-3 rounded border">
                                            <label className="form-label small fw-bold mb-2">{field.fieldName} {field.isRequired && <span className="text-danger">*</span>}</label>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="bg-light border rounded p-1" style={{width: 60, height: 60, overflow: 'hidden'}}>
                                                    {payloadData[field.fieldName] ? (
                                                        field.fieldType === 'Image' || field.presentation === 'صورة' ? 
                                                        <img src={getImageUrl(payloadData[field.fieldName])} className="w-100 h-100 object-fit-cover rounded" /> 
                                                        : <div className="d-flex align-items-center justify-content-center h-100 fw-bold text-success">✓</div>
                                                    ) : <ImageIcon className="opacity-25" size={24} />}
                                                </div>
                                                <input type="file" id={`f-${field.fieldName}`} className="d-none" onChange={e => handleDynamicFileUpload(field.fieldName, e.target.files[0])} />
                                                <label htmlFor={`f-${field.fieldName}`} className="btn btn-outline-primary btn-sm px-3 cursor-pointer">
                                                    {uploadingField === field.fieldName ? "جاري الرفع..." : "تعديل الملف"}
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

                                            // 4. تحديد نوع الإدخال المناسب
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
                    <div className="card border-0 shadow-sm p-4 rounded-3 bg-white mb-4 text-center">
                        <label className="form-label fw-bold small mb-3">الصورة الأساسية (للعرض فقط)</label>
                        <div className="bg-light border rounded-3 p-2 position-relative">
                            {coreData.imageUrl ? (
                                <img src={getImageUrl(coreData.imageUrl)} className="img-fluid rounded shadow-sm opacity-75" style={{maxHeight: '180px', objectFit: 'cover'}} />
                            ) : (
                                <ImageIcon size={32} className="opacity-25 my-4" />
                            )}
                        </div>
                        <div className="mt-2 small text-warning d-flex align-items-center justify-content-center gap-1">
                            <ExclamationTriangle /> <span>تعديل الصورة غير مدعوم حالياً.</span>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm p-4 rounded-3 bg-white">
                        <button type="submit" className="btn btn-primary w-100 py-3 fw-bold shadow" disabled={submitting}>
                            {submitting ? "جاري الحفظ..." : "حفظ التعديلات"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PostEditPage;