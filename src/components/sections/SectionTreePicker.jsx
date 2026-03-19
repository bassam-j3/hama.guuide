import React from 'react';
import { useSections } from '../../hooks/api/useSections';

const SectionTreePicker = ({ value, onChange, error }) => {
    const { data: sectionsData, isLoading, isError } = useSections();

    const sections = Array.isArray(sectionsData) ? sectionsData : [];

    // دالة مساعدة لطباعة الأقسام كشجرة هرمية داخل الـ Select
    const renderOptions = (nodes, parentId = null, level = 0) => {
        return nodes
            .filter(n => n.parentId === parentId)
            .map(n => (
                <React.Fragment key={n.id}>
                    <option value={n.id}>
                        {'\u00A0\u00A0\u00A0\u00A0'.repeat(level)}
                        {level > 0 ? '└─ ' : ''}
                        {n.title}
                    </option>
                    {renderOptions(nodes, n.id, level + 1)}
                </React.Fragment>
            ));
    };

    if (isLoading) {
        return (
            <select className="form-select text-muted" disabled>
                <option>جاري تحميل الأقسام...</option>
            </select>
        );
    }

    if (isError) {
        return (
            <div>
                <select className="form-select is-invalid" disabled>
                    <option>فشل تحميل الأقسام</option>
                </select>
                <div className="invalid-feedback d-block">تعذر جلب البيانات من الخادم.</div>
            </div>
        );
    }

    if (sections.length === 0) {
        return (
            <select className="form-select" disabled>
                <option>لا يوجد أقسام متاحة</option>
            </select>
        );
    }

    return (
        <div>
            <select
                className={`form-select ${error ? 'is-invalid' : ''}`}
                name="sectionId"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                required
            >
                <option value="">-- اختر القسم --</option>
                {renderOptions(sections)}
            </select>
            {error && <div className="invalid-feedback">{error}</div>}
        </div>
    );
};

export default SectionTreePicker;