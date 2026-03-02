import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowRight, InfoCircle, Image as ImageIcon, GeoAltFill, ExclamationTriangle } from "react-bootstrap-icons";

import { fetchAllServices } from "../../api/services/serviceService";
import { getPostById, updatePostREST } from "../../api/services/postService";
import { uploadFile } from "../../api/services/fileService";
import axiosInstance, { getImageUrl } from "../../api/axiosConfig";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import LocationPicker from '../../components/common/LocationPicker';
import DynamicFieldRenderer from "../../components/posts/DynamicFieldRenderer";
import toast from 'react-hot-toast'; // 🚀

const PostEditPage = () => {
    const { serviceSlug, postId } = useParams(); 
    const navigate = useNavigate();

    const [coreData, setCoreData] = useState({ title: "", imageUrl: "", latitude: 0, longitude: 0, addressDisplay: "" });
    const [payloadData, setPayloadData] = useState({});
    const [serviceInfo, setServiceInfo] = useState(null);
    const [schema, setSchema] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);
    const [loadError, setLoadError] = useState(null);

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
                presentation: field.presentation || field.Presentation || "نص عادي" 
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
            setLoadError('فشل تحميل بيانات البوست.');
        } finally {
            setLoading(false);
        }
    }, [serviceSlug, postId]);

    useEffect(() => { loadInitialData(); }, [loadInitialData]);

    const handleDynamicFileUpload = async (key, file) => {
        if (!file) return;
        setUploadingField(key);
        const toastId = toast.loading('جاري رفع الملف...'); // 🚀
        try {
            const res = await uploadFile(file);
            setPayloadData(p => ({ ...p, [key]: res.fileUrl || res }));
            toast.success('تم رفع الملف بنجاح', { id: toastId }); // 🚀
        } catch {
            toast.error('فشل الرفع.', { id: toastId }); // 🚀
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!coreData.title) return toast.error('العنوان مطلوب.');

        setSubmitting(true);
        const toastId = toast.loading('جاري حفظ التعديلات...'); // 🚀
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

            await updatePostREST(serviceSlug, postId, body);
            toast.success('تم حفظ التعديلات بنجاح!', { id: toastId }); // 🚀
            setTimeout(() => navigate(`/admin/posts/${serviceSlug}`), 1000);

        } catch (err) {
            const errorMsg = err.response?.data?.Errors?.[0]?.description || "فشل التحديث.";
            toast.error(errorMsg, { id: toastId }); // 🚀
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner message="جاري التحميل..." />;

    return (
        <div className="post-edit animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div><h3 className="fw-bold mb-1 text-primary">تعديل المحتوى</h3></div>
                <button className="btn btn-outline-secondary btn-sm w-100 w-md-auto" onClick={() => navigate(-1)}><ArrowRight className="me-1"/> عودة</button>
            </div>
            
            {loadError && <ErrorMessage message={loadError} />}

            <form onSubmit={handleSubmit} className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 mb-4">
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
                                        initialLat={coreData.latitude} 
                                        initialLng={coreData.longitude}
                                        onLocationSelect={(lat, lng, addr) => setCoreData(p => ({...p, latitude: lat, longitude: lng, addressDisplay: addr}))}
                                    />
                                ) : (
                                    <LocationPicker 
                                        key="new"
                                        initialLat={0} 
                                        initialLng={0}
                                        onLocationSelect={(lat, lng, addr) => setCoreData(p => ({...p, latitude: lat, longitude: lng, addressDisplay: addr}))}
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
                        <div className="dynamic-fields bg-light p-3 p-md-4 rounded-3 border border-dashed mb-4">
                            <h6 className="text-muted fw-bold mb-4 d-flex align-items-center gap-2"><InfoCircle size={18} /> التفاصيل المخصصة</h6>
                            {schema.map((field) => (
                                <DynamicFieldRenderer 
                                    key={field.fieldName}
                                    field={field} 
                                    value={payloadData[field.fieldName]} 
                                    onChange={(key, val) => setPayloadData(p => ({ ...p, [key]: val }))}
                                    onFileUpload={handleDynamicFileUpload}
                                    onAddressUpdate={(key, lat, lng, addr) => setPayloadData(p => ({ ...p, [key]: JSON.stringify([lat, lng]) }))}
                                    uploadingField={uploadingField}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 bg-white mb-4 text-center">
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

                    <div className="card border-0 shadow-sm p-3 p-md-4 rounded-3 bg-white">
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