import React from 'react';
import { 
    CloudUpload, Trash, GeoAltFill, Calendar3, Clock, 
    Hash, Type, Envelope, Telephone, FileEarmarkText, 
    Image as ImageIcon, ToggleOn 
} from 'react-bootstrap-icons';
import { getImageUrl } from '../../api/axiosConfig';
import LocationPicker from '../common/LocationPicker';

// 🚀 Senior Fix: إخراج المكون الفرعي للخارج لمنع إعادة البناء وفقدان التركيز (Focus)
const FieldWrapper = ({ fieldName, isRequired, icon, children }) => (
    <div className="mb-4 animate-fade-in">
        <label className="form-label small fw-bold d-flex align-items-center gap-2 text-dark">
            {icon} {fieldName} 
            {isRequired && <span className="text-danger" title="مطلوب">*</span>}
        </label>
        {children}
    </div>
);

const DynamicFieldRenderer = ({ 
    fieldSchema, 
    value, 
    onChange, 
    onFileUpload, 
    onAddressUpdate, 
    uploadingField 
}) => {
    const field = fieldSchema || arguments[0].field;
    const { fieldType, fieldName, isRequired, allowedTypes, presentation } = field;

    const handleChange = (val) => {
        onChange(val); 
    };

    if (fieldType === 'Bool') {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<ToggleOn className="text-success"/>}>
                <div className="form-check form-switch p-0 d-flex align-items-center gap-2 border rounded p-2 bg-light">
                    <input 
                        className="form-check-input ms-0 shadow-none" 
                        type="checkbox" 
                        role="switch"
                        id={`switch-${fieldName}`}
                        checked={!!value}
                        onChange={(e) => handleChange(e.target.checked)} 
                        style={{width: '2.5em', height: '1.25em'}}
                    />
                    <label className="form-check-label small fw-bold cursor-pointer" htmlFor={`switch-${fieldName}`}>
                        {value ? <span className="text-success">مفعل (Yes)</span> : <span className="text-muted">غير مفعل (No)</span>}
                    </label>
                </div>
            </FieldWrapper>
        );
    }

    if (fieldType === 'Image') {
        return (
            <div className="mb-4 bg-white p-3 rounded border border-dashed">
                <label className="form-label small fw-bold mb-2 d-flex align-items-center gap-2">
                    <ImageIcon className="text-primary"/> {fieldName} {isRequired && <span className="text-danger">*</span>}
                </label>
                <div className="d-flex align-items-center flex-wrap gap-3">
                    <div className="bg-light border rounded p-1 d-flex align-items-center justify-content-center position-relative shadow-sm flex-shrink-0" style={{width: 80, height: 80}}>
                        {value ? (
                            <img src={getImageUrl(value)} className="w-100 h-100 object-fit-cover rounded" alt="preview" onError={(e) => e.target.style.display='none'} />
                        ) : (
                            <ImageIcon className="text-muted opacity-25" size={32} />
                        )}
                    </div>
                    <div className="flex-grow-1 w-100" style={{minWidth: '150px'}}>
                        <input 
                            type="file" 
                            id={`img-${fieldName}`} 
                            className="d-none" 
                            accept="image/*"
                            onChange={(e) => {
                                if (onFileUpload) onFileUpload(fieldName, e.target.files[0], handleChange);
                            }} 
                            disabled={uploadingField === fieldName}
                        />
                        
                        {value ? (
                            <button type="button" className="btn btn-outline-danger btn-sm w-100 dashed-border py-2"
                                onClick={() => handleChange('')}>
                                <Trash className="me-2"/> حذف الصورة
                            </button>
                        ) : (
                            <label htmlFor={`img-${fieldName}`} className="btn btn-outline-primary btn-sm w-100 cursor-pointer border-2 py-2 mb-0 text-center d-block">
                                {uploadingField === fieldName ? <span className="spinner-border spinner-border-sm"/> : <CloudUpload className="me-2"/>} 
                                رفع صورة
                            </label>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (fieldType === 'File') {
        return (
            <div className="mb-4 bg-light p-3 rounded border">
                <label className="form-label small fw-bold mb-2 d-flex align-items-center gap-2">
                    <FileEarmarkText className="text-secondary"/> {fieldName} {isRequired && <span className="text-danger">*</span>}
                </label>
                <div className="input-group flex-nowrap">
                    <input 
                        type="file" 
                        id={`file-${fieldName}`} 
                        className="form-control text-truncate"
                        onChange={(e) => {
                             if (onFileUpload) onFileUpload(fieldName, e.target.files[0], handleChange);
                        }} 
                        disabled={uploadingField === fieldName}
                    />
                    {value && (
                        <button className="btn btn-danger flex-shrink-0" type="button" onClick={() => handleChange('')}>
                            <Trash />
                        </button>
                    )}
                </div>
                {value && <small className="text-success d-block mt-2 animate-fade-in text-truncate">تم الرفع: {value.split('/').pop()}</small>}
            </div>
        );
    }

    if (fieldType === 'Address') {
        // إذا كان هناك قيمة محفوظة مسبقاً (مصفوفة JSON)
        let savedLat = 35.1325;
        let savedLng = 36.7515;
        try {
            if (value) {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed) && parsed.length === 2) {
                    savedLat = parsed[0];
                    savedLng = parsed[1];
                }
            }
        } catch(e) {}

        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<GeoAltFill className="text-danger"/>}>
                <div className="input-group shadow-sm flex-nowrap">
                    <span className="input-group-text bg-white text-muted border-end-0 d-none d-sm-flex"><GeoAltFill /></span>
                    <input 
                        type="text" 
                        className="form-control border-start-0 text-truncate"
                        placeholder="تم تحديد الإحداثيات (اضغط الخريطة للتعديل)"
                        value={value ? `[${savedLat.toFixed(4)}, ${savedLng.toFixed(4)}]` : ''}
                        readOnly 
                        style={{backgroundColor: '#fff'}}
                    />
                    <div className="flex-shrink-0">
                        {/* 🚀 Senior Fix: توافق تام مع LocationPicker الجديد */}
                        <LocationPicker 
                            initialLat={savedLat}
                            initialLng={savedLng}
                            onLocationSelect={(lat, lng, addr) => {
                                const locationArrayString = JSON.stringify([lat, lng]);
                                handleChange(locationArrayString);
                                if(onAddressUpdate) onAddressUpdate(fieldName, lat, lng, addr, handleChange);
                            }} 
                        />
                    </div>
                </div>
            </FieldWrapper>
        );
    }

    if (fieldType === 'Enum') {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Type />}>
                <select 
                    className="form-select shadow-sm" 
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                >
                    <option value="">-- اختر من القائمة --</option>
                    {allowedTypes && allowedTypes.map((opt, idx) => {
                        const val = typeof opt === 'object' ? (opt.value || opt.key) : opt;
                        const label = typeof opt === 'object' ? (opt.key || opt.value) : opt;
                        return <option key={idx} value={val}>{label}</option>;
                    })}
                </select>
            </FieldWrapper>
        );
    }

    if (fieldType === 'DateTime') {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Calendar3 className="text-primary"/>}>
                <input 
                    type="datetime-local" 
                    className="form-control ltr-input"
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </FieldWrapper>
        );
    }
    
    if (fieldType === 'Date') {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Calendar3 className="text-info"/>}>
                <input 
                    type="date" 
                    className="form-control ltr-input"
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </FieldWrapper>
        );
    }
    
    if (fieldType === 'Timespan') {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Clock className="text-warning"/>}>
                <input 
                    type="time" 
                    step="1" 
                    className="form-control ltr-input"
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </FieldWrapper>
        );
    }

    if (['Int', 'Long'].includes(fieldType)) {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Hash className="text-dark"/>}>
                <input 
                    type="number" 
                    step="1"
                    className="form-control"
                    placeholder="0"
                    value={value !== undefined ? value : ''}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </FieldWrapper>
        );
    }
    
    if (['Float', 'Decimal'].includes(fieldType)) {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Hash className="text-dark"/>}>
                <input 
                    type="number" 
                    step="any"
                    className="form-control"
                    placeholder="0.00"
                    value={value !== undefined ? value : ''}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </FieldWrapper>
        );
    }

    if (fieldType === 'Email') {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Envelope className="text-secondary"/>}>
                <input 
                    type="email" 
                    className="form-control text-start" 
                    dir="ltr"
                    placeholder="name@example.com"
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </FieldWrapper>
        );
    }
    
    if (fieldType === 'PhoneNumber') {
        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Telephone className="text-success"/>}>
                <input 
                    type="tel" 
                    className="form-control text-start" 
                    dir="ltr"
                    placeholder="+963 9xx xxx xxx"
                    value={value || ''}
                    onChange={(e) => handleChange(e.target.value)}
                />
            </FieldWrapper>
        );
    }

    if (fieldType === 'JSON' || presentation === 'textarea' || presentation === 'نص طويل' || presentation === 'كود') {
        const displayValue = (typeof value === 'object' && value !== null) 
            ? JSON.stringify(value, null, 2) 
            : (value || '');

        return (
            <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Type className="text-muted"/>}>
                <textarea 
                    className="form-control font-monospace small" 
                    rows={5}
                    value={displayValue}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={fieldType === 'JSON' ? '{"key": "value"}' : 'أدخل النص هنا...'}
                    dir={fieldType === 'JSON' || presentation === 'كود' ? "ltr" : "rtl"}
                />
            </FieldWrapper>
        );
    }

    // Default String Fallback
    return (
        <FieldWrapper fieldName={fieldName} isRequired={isRequired} icon={<Type className="text-muted"/>}>
            <input 
                type="text" 
                className="form-control"
                value={value || ''}
                onChange={(e) => handleChange(e.target.value)}
            />
        </FieldWrapper>
    );
};

export default DynamicFieldRenderer;