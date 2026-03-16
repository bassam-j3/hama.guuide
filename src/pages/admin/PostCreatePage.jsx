import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowRight, Save, Image as ImageIcon, GeoAlt } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';

import { fetchAllServices } from '../../api/services/serviceService';
import schemaService from '../../api/services/schemaService';
import { createPost } from '../../api/services/postService';
import { uploadFile } from '../../api/services/fileService';
import { getImageUrl } from '../../api/axiosConfig';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DynamicFieldRenderer from '../../components/posts/DynamicFieldRenderer'; 

const PostCreatePage = () => {
    const { serviceSlug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    // 1. جلب الخدمات لمعرفة ID الخدمة من الـ Slug
    const { data: servicesData, isLoading: loadingServices } = useQuery({
        queryKey: ['services'],
        queryFn: fetchAllServices,
    });
    
    const services = Array.isArray(servicesData) ? servicesData : (servicesData?.items || servicesData?.data || []);
    const currentService = services.find(s => s.slug === serviceSlug);

    // 2. جلب مخطط الحقول الديناميكية (Schema) لهذه الخدمة
    const { data: schemaData, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', currentService?.id],
        queryFn: () => schemaService.getSchemaByService(currentService.id),
        enabled: !!currentService?.id,
    });

    const schemaFields = Array.isArray(schemaData) ? schemaData : (schemaData?.schema || schemaData || []);

    // 🚀 3. السحر الحقيقي: بناء Zod Validation Schema ديناميكياً بناءً على حقول الباك-إند
    const dynamicZodSchema = useMemo(() => {
        const payloadShape = {};
        
        schemaFields.forEach(field => {
            let fieldValidator = z.any();
            
            // تحديد نوع التحقق بناءً على نوع الحقل
            if (field.fieldType === 'String' || field.fieldType === 'Email' || field.fieldType === 'PhoneNumber') {
                fieldValidator = z.string();
                if (field.isRequired) fieldValidator = fieldValidator.min(1, 'هذا الحقل مطلوب');
                else fieldValidator = fieldValidator.optional().or(z.literal(''));
                
                if (field.fieldType === 'Email') fieldValidator = fieldValidator.email('بريد إلكتروني غير صالح');
            } 
            else if (field.fieldType === 'Int' || field.fieldType === 'Float' || field.fieldType === 'Decimal') {
                // تحويل النص المدخل إلى رقم قبل التحقق
                fieldValidator = z.preprocess(
                    (val) => (val === '' || val === undefined ? undefined : Number(val)), 
                    field.isRequired ? z.number({ invalid_type_error: 'يجب إدخال رقم صالح' }) : z.number().optional()
                );
            } 
            else if (field.fieldType === 'Bool') {
                fieldValidator = z.boolean().optional();
            } else {
                fieldValidator = field.isRequired ? z.string().min(1, 'مطلوب') : z.any().optional();
            }

            payloadShape[field.fieldName] = fieldValidator;
        });

        // الشكل النهائي للملف المرسل للباك-إند حسب Swagger
        return z.object({
            title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
            imageUrl: z.string().optional().or(z.literal('')),
            latitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
            longitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
            payload: z.object(payloadShape) // الحقول الديناميكية بداخل الـ payload
        });
    }, [schemaFields]);

    // 🚀 4. تهيئة React Hook Form مع Zod
    const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(dynamicZodSchema),
        defaultValues: {
            title: '',
            imageUrl: '',
            latitude: '',
            longitude: '',
            payload: {}
        }
    });

    // إرسال البيانات للباك-إند
    const createMutation = useMutation({
        mutationFn: (data) => createPost(serviceSlug, data),
        onSuccess: () => {
            toast.success('تم إنشاء البوست بنجاح!');
            queryClient.invalidateQueries(['posts', serviceSlug]);
            navigate(`/admin/services/${serviceSlug}/posts`);
        },
        onError: (err) => {
            toast.error(err.response?.data?.detail || 'فشل في إنشاء البوست. تأكد من البيانات.');
        }
    });

    const onSubmit = (data) => {
        // التأكد من وضع الإحداثيات كأرقام أو حذفها إذا كانت فارغة لتطابق Swagger
        const finalData = { ...data };
        if (!finalData.latitude) finalData.latitude = 0;
        if (!finalData.longitude) finalData.longitude = 0;
        
        createMutation.mutate(finalData);
    };

    // معالج رفع الصور للبوست
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        const toastId = toast.loading('جاري رفع الصورة...');
        try {
            const result = await uploadFile(file);
            const url = result.fileUrl || result;
            setValue('imageUrl', url); // وضع الرابط داخل الفورم
            setPreviewImage(getImageUrl(url)); // للمعاينة
            toast.success('تم الرفع!', { id: toastId });
        } catch (err) {
            toast.error('فشل الرفع!', { id: toastId });
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
                <button className="btn btn-outline-secondary btn-sm px-4" onClick={() => navigate(-1)}>
                    <ArrowRight className="me-2" /> رجوع
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="row g-4">
                {/* 🌟 العمود الأيمن: الحقول الأساسية والديناميكية */}
                <div className="col-lg-8">
                    {/* الحقول الأساسية */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-header bg-white border-bottom p-4">
                            <h5 className="fw-bold mb-0 text-dark">المعلومات الأساسية</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="mb-3">
                                <label className="form-label small fw-bold">العنوان (Title) <span className="text-danger">*</span></label>
                                <input 
                                    type="text" 
                                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                    {...register('title')} 
                                    placeholder="أدخل عنوان المنشور..."
                                />
                                {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold"><GeoAlt/> خط العرض (Latitude)</label>
                                    <input type="number" step="any" className={`form-control ${errors.latitude ? 'is-invalid' : ''}`} {...register('latitude')} placeholder="مثال: 35.13" />
                                    {errors.latitude && <div className="invalid-feedback">{errors.latitude.message}</div>}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold"><GeoAlt/> خط الطول (Longitude)</label>
                                    <input type="number" step="any" className={`form-control ${errors.longitude ? 'is-invalid' : ''}`} {...register('longitude')} placeholder="مثال: 36.75" />
                                    {errors.longitude && <div className="invalid-feedback">{errors.longitude.message}</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* الحقول الديناميكية (الـ Payload) */}
                    {schemaFields.length > 0 && (
                        <div className="card border-0 shadow-sm rounded-4 border-top border-4 border-primary">
                            <div className="card-header bg-white border-bottom p-4">
                                <h5 className="fw-bold mb-0 text-primary">البيانات المخصصة للخدمة</h5>
                                <p className="small text-muted mb-0 mt-1">هذه الحقول محددة برمجياً من الـ Schema Manager.</p>
                            </div>
                            <div className="card-body p-4 row g-3">
                                {schemaFields.map(field => (
                                    <div key={field.fieldName} className="col-md-6">
                                        <label className="form-label small fw-bold">
                                            {field.fieldName} {field.isRequired && <span className="text-danger">*</span>}
                                        </label>
                                        
                                        {/* دمج DynamicFieldRenderer مع Controller الخاص بـ React Hook Form */}
                                        <Controller
                                            name={`payload.${field.fieldName}`}
                                            control={control}
                                            render={({ field: controllerField }) => (
                                                <DynamicFieldRenderer 
                                                    fieldSchema={field} 
                                                    value={controllerField.value} 
                                                    onChange={controllerField.onChange} 
                                                />
                                            )}
                                        />
                                        {errors?.payload?.[field.fieldName] && (
                                            <div className="text-danger small mt-1">{errors.payload[field.fieldName].message}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 🌟 العمود الأيسر: الصورة وزر الحفظ */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-4 text-center">
                            <label className="form-label fw-bold small mb-3 d-block">صورة المنشور (اختياري)</label>
                            <div className="mb-3 border rounded-3 p-2 bg-light d-flex align-items-center justify-content-center overflow-hidden position-relative" style={{ minHeight: '200px' }}>
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" className="img-fluid rounded w-100 h-100 object-fit-cover position-absolute" />
                                ) : (
                                    <div className="text-muted small"><ImageIcon size={40} className="d-block mx-auto mb-2 opacity-25" /> لا توجد صورة</div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                className="form-control form-control-sm mb-2" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                disabled={uploading || isSubmitting} 
                            />
                            <input type="hidden" {...register('imageUrl')} />
                            {errors.imageUrl && <div className="text-danger small mt-1">{errors.imageUrl.message}</div>}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-success w-100 py-3 fw-bold d-flex justify-content-center align-items-center gap-2 rounded-4 shadow"
                        disabled={isSubmitting || uploading}
                    >
                        {isSubmitting ? <span className="spinner-border spinner-border-sm" /> : <Save size={20} />}
                        {isSubmitting ? 'جاري الحفظ...' : 'حفظ ونشر'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostCreatePage;