import React, { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { GeoAltFill } from 'react-bootstrap-icons';
import LocationPicker from '../common/LocationPicker';
import toast from 'react-hot-toast';

const PostLocationSection = ({ control, setValue, register, errors }) => {
    // 🚀 Senior Fix: استخدام useWatch يعزل إعادة الرسم (Re-renders) داخل هذا المكون الصغير فقط
    const [lat, lng] = useWatch({
        control,
        name: ['latitude', 'longitude']
    });

    // تسجيل الحقول برمجياً لكي يراقبها React Hook Form بدون الحاجة لحقول مخفية (Hidden Inputs)
    useEffect(() => {
        register('latitude');
        register('longitude');
    }, [register]);

    return (
        <div className="mb-3 animate-fade-in">
            <label className="form-label fw-bold small text-dark">
                <GeoAltFill className="me-1 text-danger"/> الموقع الجغرافي
            </label>
            <div className="p-3 border rounded-3 bg-light d-flex flex-column gap-2 align-items-start shadow-sm">
                <LocationPicker 
                    initialLat={Number(lat) || 35.1325} 
                    initialLng={Number(lng) || 36.7515} 
                    onLocationSelect={(newLat, newLng, address) => {
                        setValue('latitude', newLat, { shouldValidate: true });
                        setValue('longitude', newLng, { shouldValidate: true });
                        if (address) toast.success(`تم التحديث: ${address}`);
                    }} 
                />
                <div className="small text-muted mt-2 fw-bold">
                    {lat && lng ? (
                        <span className="text-success">
                            الإحداثيات الحالية: {Number(lat).toFixed(4)} , {Number(lng).toFixed(4)}
                        </span>
                    ) : (
                        'لم يتم تحديد موقع بعد'
                    )}
                </div>
            </div>
            
            {(errors?.latitude || errors?.longitude) && (
                <div className="text-danger small mt-1 fw-bold">يرجى التأكد من الإحداثيات على الخريطة</div>
            )}
        </div>
    );
};

// 🚀 استخدام React.memo يمنع إعادة رسم المكون إذا لم تتغير خصائصه (Props)
export default React.memo(PostLocationSection);