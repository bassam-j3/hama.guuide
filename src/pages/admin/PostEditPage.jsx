import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowRight, InfoCircle, Image as ImageIcon, GeoAltFill } from "react-bootstrap-icons";
import toast from 'react-hot-toast'; 

import { fetchAllServices } from "../../api/services/serviceService";
import { getPostById, updatePostREST } from "../../api/services/postService";
import schemaService from '../../api/services/schemaService';
import { uploadFile } from "../../api/services/fileService";
import { getImageUrl } from "../../api/axiosConfig";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorMessage from "../../components/common/ErrorMessage";
import LocationPicker from '../../components/common/LocationPicker';
import DynamicFieldRenderer from "../../components/posts/DynamicFieldRenderer";

const PostEditPage = () => {
    const { serviceSlug, postId } = useParams(); 
    const navigate = useNavigate();
    const { triggerGlobalRefresh } = useOutletContext(); 
    const queryClient = useQueryClient();

    const [uploading, setUploading] = useState(false);
    const [uploadingField, setUploadingField] = useState(null);
    const [previewImage, setPreviewImage] = useState('');
    const [addressDisplay, setAddressDisplay] = useState('');

    // 1. جلب الخدمات والبوست في نفس الوقت
    const { data: initialData, isLoading: loadingInitial, isError: errorInitial } = useQuery({
        queryKey: ['post-edit', serviceSlug, postId],
        queryFn: async () => {
            const [services, post] = await Promise.all([
                fetchAllServices(),
                getPostById(serviceSlug, postId)
            ]);
            const service = services.find(s => s.slug === serviceSlug);
            if (!service) throw new Error("الخدمة غير موجودة");
            return { service, post };
        }
    });

    // 2. جلب المخطط (Schema)
    const { data: schemaData, isLoading: loadingSchema } = useQuery({
        queryKey: ['schema', initialData?.service?.id],
        queryFn: () => schemaService.getSchemaByService(initialData.service.id),
        enabled: !!initialData?.service?.id,
    });

    const schemaFields = Array.isArray(schemaData) ? schemaData : (schemaData?.schema || schemaData || []);

    // 3. بناء Zod Schema
    const dynamicZodSchema = useMemo(() => {
        const payloadShape = {};
        schemaFields.forEach(field => {
            let fieldValidator = z.any();
            if (field.fieldType === 'String' || field.fieldType === 'Email' || field.fieldType === 'PhoneNumber') {
                fieldValidator = z.string();
                if (field.isRequired) fieldValidator = fieldValidator.min(1, 'هذا الحقل مطلوب');
                else fieldValidator = fieldValidator.optional().or(z.literal(''));
            } 
            else if (field.fieldType === 'Int' || field.fieldType === 'Float' || field.fieldType === 'Decimal') {
                fieldValidator = z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), 
                    field.isRequired ? z.number({ invalid_type_error: 'رقم غير صالح' }) : z.number().optional()
                );
            } 
            else if (field.fieldType === 'Bool') fieldValidator = z.boolean().optional();
            else fieldValidator = field.isRequired ? z.string().min(1, 'مطلوب') : z.any().optional();

            payloadShape[field.fieldName] = fieldValidator;
        });

        return z.object({
            title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
            imageUrl: z.string().optional().or(z.literal('')),
            latitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
            longitude: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
            payload: z.object(payloadShape)
        });
    }, [schemaFields]);

    // 4. إعداد React Hook Form وتعبئة البيانات القديمة
    const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(dynamicZodSchema),
    });

    // تعبئة الفورم عندما تصل البيانات
    useEffect(() => {
        if (initialData?.post && schemaFields.length >= 0) {
            const p = initialData.post;
            
            // تجهيز הـ Payload حسب הـ Schema
            const initialPayload = {};
            schemaFields.forEach(field => {
                const existingValue = p.payload ? p.payload[field.fieldName] : undefined;
                initialPayload[field.fieldName] = existingValue !== undefined ? existingValue : (field.fieldType === 'Bool' ? false : "");
            });

            reset({
                title: p.title || '',
                imageUrl: p.imageUrl || '',
                latitude: p.latitude || 0,
                longitude: p.longitude || 0,
                payload: initialPayload
            });

            if (p.imageUrl) setPreviewImage(getImageUrl(p.imageUrl));
        }
    }, [initialData, schemaFields, reset]);

    // معالج الرفع للـ Dynamic Fields
    const handleDynamicFileUpload = async (key, file, formOnChange) => {
        if (!file) return;
        setUploadingField(key);
        const toastId = toast.loading('جاري رفع الملف...'); 
        try {
            const res = await uploadFile(file);
            const url = res.fileUrl || res;
            formOnChange(url); // تحديث الحقل في الفورم
            toast.success('تم رفع الملف بنجاح', { id: toastId }); 
        } catch {
            toast.error('فشل الرفع.', { id: toastId }); 
        } finally {
            setUploadingField(null);
        }
    };

    // معالج الرفع للصورة الأساسية
    const handleMainImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading('جاري رفع الصورة...');
        try {
            const result = await uploadFile(file);
            const url = result.fileUrl || result;
            setValue('imageUrl', url); 
            setPreviewImage(getImageUrl(url));
            toast.success('تم الرفع!', { id: toastId });
        } catch {
            toast.error('فشل الرفع!', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    // 5. التحديث عبر React Query Mutation
    const updateMutation = useMutation({
        mutationFn: (body) => updatePostREST(serviceSlug, postId, body),
        onSuccess: () => {
            toast.success('تم حفظ التعديلات بنجاح!');
            queryClient.invalidateQueries(['posts', serviceSlug]); 
            triggerGlobalRefresh(); 
            setTimeout(() => navigate(`/admin/services/${serviceSlug}/posts`), 1000);
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.Errors?.[0]?.description || err.response?.data?.detail || "فشل التحديث.";
            toast.error(errorMsg);
        }
    });

    const onSubmit = (data) => {
        const finalData = { ...data };
        if (!finalData.latitude) finalData.latitude = 0;
        if (!finalData.longitude) finalData.longitude = 0;
        updateMutation.mutate(finalData);
    };

    if (loadingInitial || loadingSchema) return <LoadingSpinner message="جاري جلب بيانات البوست والمخطط..." />;
    if (errorInitial) return <ErrorMessage message="فشل تحميل بيانات البوست." />;

    return (
        <div className="post-edit animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary">تعديل المحتوى</h3>
                    <p className="text-muted small mb-0">لخدمة: <span className="fw-bold text-dark">{initialData?.service?.title}</span></p>
                </div>
                <button className="btn btn-outline-secondary btn-sm w-100 w-md-auto" onClick={() => navigate(-1)}><ArrowRight className="me-1"/> عودة</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4 rounded-4 mb-4">
                        <h5 className="fw-bold mb-4 text-dark border-bottom pb-3">المعلومات الأساسية</h5>
                        <div className="mb-4">
                            <label className="form-label fw-bold small">العنوان الأساسي <span className="text-danger">*</span></label>
                            <input 
                                type="text" 
                                className={`form-control form-control-lg border-2 ${errors.title ? 'is-invalid' : ''}`}
                                {...register('title')} 
                            />
                            {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label fw-bold small"><GeoAltFill className="me-1"/> الموقع على الخريطة</label>
                            <div className="border rounded p-2 bg-light">
                                {/* نستخدم Controller للحصول على إحداثيات الموقع */}
                                <Controller
                                    name="latitude"
                                    control={control}
                                    render={({ field: latField }) => (
                                        <Controller
                                            name="longitude"
                                            control={control}
                                            render={({ field: lngField }) => (
                                                <LocationPicker 
                                                    key={`loc-${latField.value}-${lngField.value}`}
                                                    initialLat={Number(latField.value) || 0} 
                                                    initialLng={Number(lngField.value) || 0}
                                                    onLocationSelect={(lat, lng, addr) => {
                                                        latField.onChange(lat);
                                                        lngField.onChange(lng);
                                                        setAddressDisplay(addr);
                                                    }}
                                                />
                                            )}
                                        />
                                    )}
                                />
                                {addressDisplay && <div className="mt-2 p-2 bg-white border border-success rounded text-success fw-bold small"><GeoAltFill className="me-2" />{addressDisplay}</div>}
                            </div>
                        </div>
                    </div>

                    {schemaFields.length > 0 && (
                        <div className="card border-0 shadow-sm rounded-4 border-top border-4 border-primary mb-4">
                            <div className="card-header bg-white border-bottom p-4">
                                <h5 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2"><InfoCircle size={18} /> التفاصيل المخصصة للخدمة</h5>
                            </div>
                            <div className="card-body p-4 row g-3">
                                {schemaFields.map((field) => (
                                    <div key={field.fieldName} className="col-md-6">
                                        <Controller
                                            name={`payload.${field.fieldName}`}
                                            control={control}
                                            render={({ field: controllerField }) => (
                                                <DynamicFieldRenderer 
                                                    fieldSchema={field} 
                                                    value={controllerField.value} 
                                                    onChange={controllerField.onChange}
                                                    onFileUpload={handleDynamicFileUpload}
                                                    uploadingField={uploadingField}
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

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 text-center">
                        <label className="form-label fw-bold small mb-3">الصورة الأساسية</label>
                        <div className="bg-light border rounded-3 p-2 mb-3 position-relative" style={{minHeight: '180px'}}>
                            {previewImage ? (
                                <img src={previewImage} className="img-fluid rounded w-100 h-100 object-fit-cover position-absolute top-0 start-0" />
                            ) : (
                                <ImageIcon size={40} className="opacity-25 mt-5" />
                            )}
                        </div>
                        <input type="file" className="form-control form-control-sm" accept="image/*" onChange={handleMainImageUpload} disabled={uploading || isSubmitting} />
                        <input type="hidden" {...register('imageUrl')} />
                    </div>

                    <button type="submit" className="btn btn-success w-100 py-3 fw-bold shadow-lg" disabled={updateMutation.isPending || isSubmitting}>
                        {updateMutation.isPending || isSubmitting ? <span className="spinner-border spinner-border-sm me-2"/> : <Save size={20} className="me-2"/>} 
                        {updateMutation.isPending || isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PostEditPage;