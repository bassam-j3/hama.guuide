import React from 'react';
import { 
    CloudUpload, Trash, GeoAltFill, Calendar3, Clock, 
    Hash, Type, Envelope, Telephone, FileEarmarkText, 
    Image as ImageIcon, ToggleOn 
} from 'react-bootstrap-icons';
import { getImageUrl } from '../../api/axiosConfig';
import LocationPicker from '../common/LocationPicker';

const DynamicFieldRenderer = ({ 
    field, 
    value, 
    onChange, 
    onFileUpload, 
    onAddressUpdate, 
    uploadingField 
}) => {
    const { fieldType, fieldName, isRequired, allowedTypes, presentation } = field;

    const FieldWrapper = ({ children, icon }) => (
        <div className="mb-4 animate-fade-in">
            <label className="form-label small fw-bold d-flex align-items-center gap-2 text-dark">
                {icon} {fieldName} 
                {isRequired && <span className="text-danger" title="مطلوب">*</span>}
            </label>
            {children}
        </div>
    );

    if (fieldType === 'Bool') {
        return (
            <FieldWrapper icon={<ToggleOn className="text-success"/>}>
                <div className="form-check form-switch p-0 d-flex align-items-center gap-2 border rounded p-2 bg-light">
                    <input 
                        className="form-check-input ms-0 shadow-none" 
                        type="checkbox" 
                        role="switch"
                        id={`switch-${fieldName}`}
                        checked={!!value}
                        onChange={(e) => onChange(fieldName, e.target.checked)} 
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
                {/* 🚀 متجاوب: flex-wrap و w-100 */}
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
                            onChange={(e) => onFileUpload(fieldName, e.target.files[0])} 
                            disabled={uploadingField !== null}
                        />
                        
                        {value ? (
                            <button type="button" className="btn btn-outline-danger btn-sm w-100 dashed-border py-2"
                                onClick={() => onChange(fieldName, '')}>
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
                {/* 🚀 متجاوب: flex-nowrap للحفاظ على الأيقونة بجانب المربع */}
                <div className="input-group flex-nowrap">
                    <input 
                        type="file" 
                        id={`file-${fieldName}`} 
                        className="form-control text-truncate"
                        onChange={(e) => onFileUpload(fieldName, e.target.files[0])} 
                        disabled={uploadingField !== null}
                    />
                    {value && (
                        <button className="btn btn-danger flex-shrink-0" type="button" onClick={() => onChange(fieldName, '')}>
                            <Trash />
                        </button>
                    )}
                </div>
                {value && <small className="text-success d-block mt-2 animate-fade-in text-truncate">تم الرفع: {value.split('/').pop()}</small>}
            </div>
        );
    }

    if (fieldType === 'Address') {
        return (
            <FieldWrapper icon={<GeoAltFill className="text-danger"/>}>
                <div className="input-group shadow-sm flex-nowrap">
                    <span className="input-group-text bg-white text-muted border-end-0 d-none d-sm-flex"><GeoAltFill /></span>
                    <input 
                        type="text" 
                        className="form-control border-start-0 text-truncate"
                        placeholder="اختر من الخريطة..."
                        value={value || ''}
                        readOnly 
                        required={isRequired}
                        style={{backgroundColor: '#fff'}}
                    />
                    <div className="flex-shrink-0">
                        <LocationPicker 
                            onLocationSelect={(lat, lng, addr) => onAddressUpdate(fieldName, lat, lng, addr)} 
                        />
                    </div>
                </div>
            </FieldWrapper>
        );
    }

    if (fieldType === 'Enum') {
        return (
            <FieldWrapper icon={<Type />}>
                <select 
                    className="form-select shadow-sm" 
                    value={value || ''}
                    required={isRequired}
                    onChange={(e) => onChange(fieldName, e.target.value)}
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
            <FieldWrapper icon={<Calendar3 className="text-primary"/>}>
                <input 
                    type="datetime-local" 
                    className="form-control ltr-input"
                    value={value || ''}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                />
            </FieldWrapper>
        );
    }
    
    if (fieldType === 'Date') {
        return (
            <FieldWrapper icon={<Calendar3 className="text-info"/>}>
                <input 
                    type="date" 
                    className="form-control ltr-input"
                    value={value || ''}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                />
            </FieldWrapper>
        );
    }
    
    if (fieldType === 'Timespan') {
        return (
            <FieldWrapper icon={<Clock className="text-warning"/>}>
                <input 
                    type="time" 
                    step="1" 
                    className="form-control ltr-input"
                    value={value || ''}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                />
            </FieldWrapper>
        );
    }

    if (['Int', 'Long'].includes(fieldType)) {
        return (
            <FieldWrapper icon={<Hash className="text-dark"/>}>
                <input 
                    type="number" 
                    step="1"
                    className="form-control"
                    placeholder="0"
                    value={value || ''}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                />
            </FieldWrapper>
        );
    }
    
    if (['Float', 'Decimal'].includes(fieldType)) {
        return (
            <FieldWrapper icon={<Hash className="text-dark"/>}>
                <input 
                    type="number" 
                    step="any"
                    className="form-control"
                    placeholder="0.00"
                    value={value || ''}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                />
            </FieldWrapper>
        );
    }

    if (fieldType === 'Email') {
        return (
            <FieldWrapper icon={<Envelope className="text-secondary"/>}>
                <input 
                    type="email" 
                    className="form-control text-start" 
                    dir="ltr"
                    placeholder="name@example.com"
                    value={value || ''}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                />
            </FieldWrapper>
        );
    }
    
    if (fieldType === 'PhoneNumber') {
        return (
            <FieldWrapper icon={<Telephone className="text-success"/>}>
                <input 
                    type="tel" 
                    className="form-control text-start" 
                    dir="ltr"
                    placeholder="+963 9xx xxx xxx"
                    value={value || ''}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                />
            </FieldWrapper>
        );
    }

    if (fieldType === 'JSON' || presentation === 'textarea' || presentation === 'نص طويل' || presentation === 'كود') {
        const displayValue = (typeof value === 'object' && value !== null) 
            ? JSON.stringify(value, null, 2) 
            : (value || '');

        return (
            <FieldWrapper icon={<Type className="text-muted"/>}>
                <textarea 
                    className="form-control font-monospace small" 
                    rows={5}
                    value={displayValue}
                    onChange={(e) => onChange(fieldName, e.target.value)}
                    required={isRequired}
                    placeholder={fieldType === 'JSON' ? '{"key": "value"}' : 'أدخل النص هنا...'}
                    dir={fieldType === 'JSON' || presentation === 'كود' ? "ltr" : "rtl"}
                />
            </FieldWrapper>
        );
    }

    // Default String Fallback
    return (
        <FieldWrapper icon={<Type className="text-muted"/>}>
            <input 
                type="text" 
                className="form-control"
                value={value || ''}
                onChange={(e) => onChange(fieldName, e.target.value)}
                required={isRequired}
            />
        </FieldWrapper>
    );
};

export default DynamicFieldRenderer;