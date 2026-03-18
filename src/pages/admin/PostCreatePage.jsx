import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Save, Image as ImageIcon, GeoAlt } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

import { fetchAllServices } from '../../api/services/serviceService';
import schemaService from '../../api/services/schemaService';
import { createPostREST } from '../../api/services/postService';
import { uploadFile } from '../../api/services/fileService';
import { getImageUrl } from '../../api/axiosConfig';
import { buildDynamicSchema } from '../../utils/schemaBuilder'; // 🚀 استيراد اللوجيك المنفصل

import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DynamicFieldRenderer from '../../components/posts/DynamicFieldRenderer'; 
import LocationPicker from '../../components/common/LocationPicker';

const PostCreatePage = () => {
    const { serviceSlug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    const { data: servicesData, isLoading: loadingServices } = useQuery({
        queryKey: ['services'],
        queryFn: fetchAllServices,
    });
    
    const services = Array.isArray(servicesData) ? servicesData : (servicesData?.items || servicesData?.data || []);
    const currentService = services.find(s => s.slug === serviceSlug);

    const { data: schemaData, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', currentService?.id],
        queryFn: () => schemaService.getSchemaByService(currentService.id),
        enabled: !!currentService?.id,
    });

    const schemaFields = Array.isArray(schemaData) ? schemaData : (schemaData?.schema || schemaData || []);

    // 🚀 استخدام المساعد الخارجي بدلاً من كتابة المنطق هنا
    const dynamicZodSchema = useMemo(() => buildDynamicSchema(schemaFields), [schemaFields]);

    const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(dynamicZodSchema),
        defaultValues: { title: '', imageUrl: '', latitude: 35.1325, longitude: 36.7515, payload: {} }
    });

    const currentLat = watch('latitude');
    const currentLng = watch('longitude');

    const createMutation = useMutation({
        mutationFn: (data) => createPostREST(serviceSlug, data),
        onSuccess: () => {
            toast.success('تم إنشاء البوست بنجاح!');
            queryClient.invalidateQueries(['posts', serviceSlug]);
            navigate(`/admin/services/${serviceSlug}/posts`);
        },
        onError: (err) => toast.error(err.response?.data?.detail || 'فشل في إنشاء البوست. تأكد من البيانات.')
    });

    const onSubmit = (data) => {
        const finalData = { ...data };
        if (!finalData.latitude) finalData.latitude = 0;
        if (!finalData.longitude) finalData.longitude = 0;
        createMutation.mutate(finalData);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading('جاري رفع الصورة...');
        try {
            const url = await uploadFile(file);
            setValue('imageUrl', url, { shouldValidate: true });
            setPreviewImage(getImageUrl(url)); 
            toast.success('تم الرفع!', { id: toastId });
        } catch (err) {
            toast.error(err.message || 'فشل الرفع!', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    if (loadingServices || loadingSchema) return <LoadingSpinner message="جاري تجهيز بيئة العمل..." />;
    if (!currentService) return <ErrorMessage message="الخدمة المطلوبة غير موجودة!" />;

    return (
        <div className="post-create-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">إضافة منشور جديد</h3>
                    <p className="text-muted small mb-0">لخدمة: <span className="fw-bold text-dark">{currentService.title}</span></p>
                </div>
                <button type="button" className="btn btn-outline-secondary btn-sm px-4" onClick={() => navigate(-1)}>
                    <ArrowRight className="me-2" /> رجوع
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom p-4">
                            <h5 className="fw-bold mb-0 text-dark">المعلومات الأساسية</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="mb-4">
                                <label className="form-label small fw-bold">العنوان (Title) <span className="text-danger">*</span></label>
                                <input type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`} {...register('title')} placeholder="أدخل عنوان المنشور..." />
                                {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label small fw-bold"><GeoAlt className="me-1"/> الموقع الجغرافي</label>
                                <div className="p-3 border rounded-3 bg-light d-flex flex-column gap-2 align-items-start">
                                    <LocationPicker 
                                        initialLat={currentLat} 
                                        initialLng={currentLng} 
                                        onLocationSelect={(lat, lng, address) => {
                                            setValue('latitude', lat, { shouldValidate: true });
                                            setValue('longitude', lng, { shouldValidate: true });
                                            if (address) toast.success(`تم تحديد الموقع بنجاح`);
                                        }} 
                                    />
                                    <div className="small text-muted mt-2">
                                        {currentLat && currentLng ? `الإحداثيات الحالية: ${Number(currentLat).toFixed(4)} , ${Number(currentLng).toFixed(4)}` : 'لم يتم تحديد موقع بعد'}
                                    </div>
                                </div>
                                <input type="hidden" {...register('latitude')} />
                                <input type="hidden" {...register('longitude')} />
                                {(errors.latitude || errors.longitude) && <div className="text-danger small mt-1">يرجى التأكد من الإحداثيات على الخريطة</div>}
                            </div>
                        </div>
                    </div>

                    {schemaFields.length > 0 && (
                        <div className="card border-0 shadow-sm rounded-4 border-top border-4 border-primary">
                            <div className="card-header bg-white border-bottom p-4"><h5 className="fw-bold mb-0 text-primary">البيانات المخصصة للخدمة</h5></div>
                            <div className="card-body p-4 row g-3">
                                {schemaFields.map(field => (
                                    <div key={field.fieldName} className="col-md-6">
                                        <label className="form-label small fw-bold">{field.fieldName} {field.isRequired && <span className="text-danger">*</span>}</label>
                                        <Controller name={`payload.${field.fieldName}`} control={control} render={({ field: controllerField }) => (
                                                <DynamicFieldRenderer fieldSchema={field} value={controllerField.value || ''} 
                                                    onChange={(val) => { val && val.target ? controllerField.onChange(val.target.value) : controllerField.onChange(val); }} 
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
                    <div className="card border-0 shadow-sm rounded-4 mb-4 text-center">
                        <div className="card-body p-4">
                            <label className="form-label fw-bold small mb-3 d-block">صورة المنشور (اختياري)</label>
                            <div className="mb-3 border rounded-3 p-2 bg-light d-flex align-items-center justify-content-center overflow-hidden position-relative" style={{ minHeight: '200px' }}>
                                {previewImage ? <img src={previewImage} alt="Preview" className="img-fluid rounded w-100 h-100 object-fit-cover position-absolute" /> : <div className="text-muted small"><ImageIcon size={40} className="d-block mx-auto mb-2 opacity-25" /> لا توجد صورة</div>}
                            </div>
                            <input type="file" className="form-control form-control-sm mb-2" accept="image/*" onChange={handleImageUpload} disabled={uploading || isSubmitting} />
                            <input type="hidden" {...register('imageUrl')} />
                            {errors.imageUrl && <div className="text-danger small mt-1">{errors.imageUrl.message}</div>}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-success w-100 py-3 fw-bold d-flex justify-content-center align-items-center gap-2 rounded-4 shadow" disabled={isSubmitting || uploading}>
                        {isSubmitting ? <span className="spinner-border spinner-border-sm" /> : <Save size={20} />} {isSubmitting ? 'جاري الحفظ...' : 'حفظ ونشر'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostCreatePage;