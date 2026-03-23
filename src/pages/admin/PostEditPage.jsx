import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ArrowRight, InfoCircle, Image as ImageIcon } from "react-bootstrap-icons";
import toast from 'react-hot-toast'; 

import { fetchAllServices } from "../../api/services/serviceService";
import { getPostById, updatePostREST } from "../../api/services/postService";
import schemaService from '../../api/services/schemaService';
import { uploadFile } from "../../api/services/fileService";
import { getImageUrl } from "../../api/axiosConfig";
import { buildDynamicSchema, generateDefaultPayload } from '../../utils/schemaBuilder';

import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import DynamicFieldRenderer from "../../components/posts/DynamicFieldRenderer";
import PostLocationSection from '../../components/posts/PostLocationSection';

const PostEditPage = () => {
    const { serviceSlug, postId } = useParams(); 
    const navigate = useNavigate();
    const { triggerGlobalRefresh } = useOutletContext(); 
    const queryClient = useQueryClient();

    const [uploading, setUploading] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);
    const [previewImage, setPreviewImage] = useState('');

    const { data: initialData, isLoading: loadingInitial, isError: errorInitial } = useQuery({
        queryKey: ['post-edit', serviceSlug, postId],
        queryFn: async () => {
            const [services, post] = await Promise.all([fetchAllServices(), getPostById(serviceSlug, postId)]);
            const service = services.find(s => s.slug === serviceSlug);
            if (!service) throw new Error("الخدمة غير موجودة");
            return { service, post };
        }
    });

    const { data: schemaData, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', initialData?.service?.id],
        queryFn: () => schemaService.getSchemaByService(initialData.service.id),
        enabled: !!initialData?.service?.id,
    });

    const schemaFields = Array.isArray(schemaData) ? schemaData : (schemaData?.schema || schemaData || []);
    const dynamicZodSchema = useMemo(() => buildDynamicSchema(schemaFields), [schemaFields]);

    const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(dynamicZodSchema),
        defaultValues: { title: '', imageUrl: '', latitude: 0, longitude: 0, payload: {} }
    });

    useEffect(() => {
        if (initialData?.post && schemaFields.length >= 0) {
            const p = initialData.post;
            reset({
                title: p.title || '',
                imageUrl: p.imageUrl || '',
                latitude: p.latitude || 35.1325,
                longitude: p.longitude || 36.7515,
                payload: generateDefaultPayload(schemaFields, p.payload || {})
            });
            if (p.imageUrl) setPreviewImage(getImageUrl(p.imageUrl));
        }
    }, [initialData, schemaFields, reset]);

    const handleDynamicFileUpload = async (key, file, formOnChange) => {
        if (!file) return;
        setUploadingField(key);
        const toastId = toast.loading('جاري رفع الملف...'); 
        try {
            const res = await uploadFile(file);
            formOnChange(res.fileUrl || res); 
            toast.success('تم رفع الملف بنجاح', { id: toastId }); 
        } catch { toast.error('فشل الرفع.', { id: toastId }); } 
        finally { setUploadingField(null); }
    };

    const handleMainImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading('جاري رفع الصورة...');
        try {
            const result = await uploadFile(file);
            const url = result.fileUrl || result;
            setValue('imageUrl', url, { shouldValidate: true }); 
            setPreviewImage(getImageUrl(url));
            toast.success('تم الرفع!', { id: toastId });
        } catch { toast.error('فشل الرفع!', { id: toastId }); } 
        finally { setUploading(false); }
    };

    const updateMutation = useMutation({
        mutationFn: (body) => updatePostREST(serviceSlug, postId, body),
        onSuccess: () => {
            toast.success('تم حفظ التعديلات بنجاح!');
            queryClient.invalidateQueries({ queryKey: ['posts', serviceSlug] }); // 👈 إصلاح الكاش
            triggerGlobalRefresh(); 
            setTimeout(() => navigate(`/admin/posts/${serviceSlug}`), 1000); // 👈 تم إصلاح رابط التوجيه هنا!
        },
        onError: (err) => {
            if (err.response?.status === 500) toast.error("خطأ 500: انهيار في السيرفر الداخلي");
            else toast.error(err.response?.data?.Errors?.[0]?.description || err.response?.data?.detail || "فشل التحديث.");
        }
    });

    const onSubmit = (data) => {
        const finalData = { ...data };
        finalData.latitude = parseFloat(finalData.latitude) || 0;
        finalData.longitude = parseFloat(finalData.longitude) || 0;
        updateMutation.mutate(finalData);
    };

    if (loadingInitial || loadingSchema) return <LoadingSpinner message="جاري جلب بيانات البوست والمخطط..." />;
    if (errorInitial) return <ErrorMessage message="فشل تحميل بيانات البوست." />;

    return (
        <div className="post-edit animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div><h3 className="fw-bold mb-1 text-primary">تعديل المحتوى</h3><p className="text-muted small mb-0">لخدمة: <span className="fw-bold text-dark">{initialData?.service?.title}</span></p></div>
                <button type="button" className="btn btn-outline-secondary btn-sm w-100 w-md-auto" onClick={() => navigate(-1)}><ArrowRight className="me-1"/> عودة</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 rounded-4 mb-4">
                        <h5 className="fw-bold mb-4 text-dark border-bottom pb-3">المعلومات الأساسية</h5>
                        <div className="mb-4">
                            <label className="form-label fw-bold small">العنوان الأساسي <span className="text-danger">*</span></label>
                            <input type="text" className={`form-control form-control-lg border-2 ${errors.title ? 'is-invalid' : ''}`} {...register('title')} />
                            {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                        </div>
                        
                        <PostLocationSection control={control} setValue={setValue} register={register} errors={errors} />

                    </div>

                    {schemaFields.length > 0 && (
                        <div className="card border-0 shadow-sm rounded-4 border-top border-4 border-primary mb-4">
                            <div className="card-header bg-white border-bottom p-4"><h5 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2"><InfoCircle size={18} /> التفاصيل المخصصة للخدمة</h5></div>
                            <div className="card-body p-4 row g-3">
                                {schemaFields.map((field) => (
                                    <div key={field.fieldName} className="col-md-6">
                                        <label className="form-label small fw-bold">{field.fieldName} {field.isRequired && <span className="text-danger">*</span>}</label>
                                        <Controller name={`payload.${field.fieldName}`} control={control} render={({ field: controllerField }) => (
                                                <DynamicFieldRenderer fieldSchema={field} value={controllerField.value || ''} 
                                                    onChange={(val) => { val && val.target ? controllerField.onChange(val.target.value) : controllerField.onChange(val); }}
                                                    onFileUpload={handleDynamicFileUpload} uploadingField={uploadingField}
                                                />
                                        )}/>
                                        {errors?.payload?.[field.fieldName] && <div className="text-danger small mt-1">{errors.payload[field.fieldName].message}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 text-center">
                        <label className="form-label fw-bold small mb-3">الصورة الأساسية (اختياري)</label>
                        <div className="bg-light border rounded-3 p-2 mb-3 position-relative" style={{minHeight: '180px'}}>
                            {previewImage ? <img src={previewImage} className="img-fluid rounded w-100 h-100 object-fit-cover position-absolute top-0 start-0" /> : <ImageIcon size={40} className="opacity-25 mt-5" />}
                        </div>
                        <input type="file" className="form-control form-control-sm" accept="image/*" onChange={handleMainImageUpload} disabled={uploading || isSubmitting} />
                        <input type="hidden" {...register('imageUrl')} />
                    </div>
                    <button type="submit" className="btn btn-success w-100 py-3 fw-bold shadow-lg" disabled={updateMutation.isPending || isSubmitting}>
                        {updateMutation.isPending || isSubmitting ? <span className="spinner-border spinner-border-sm me-2"/> : <Save size={20} className="me-2"/>} {updateMutation.isPending || isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostEditPage;