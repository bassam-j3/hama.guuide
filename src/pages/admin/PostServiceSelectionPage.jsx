import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Collection, PlusLg } from "react-bootstrap-icons";
import { fetchAllServices } from "../../api/services/serviceService"; 
import LoadingSpinner from "../../components/common/LoadingSpinner";

const PostServiceSelectionPage = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadServices = async () => {
            try {
                const data = await fetchAllServices(); 
                setServices(Array.isArray(data) ? data : []);
            } catch (err) {
                setError("فشل في تحميل قائمة الخدمات. يرجى التحقق من الاتصال.");
            } finally {
                setLoading(false);
            }
        };
        loadServices();
    }, []);

    const filteredServices = useMemo(() => {
        return services.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [services, searchTerm]);

    if (loading) return <LoadingSpinner message="جاري تحميل الخدمات..." />;

    if (error) return <div className="container py-5 text-center"><div className="alert alert-danger d-inline-block px-5">{error}</div></div>;

    return (
        <div className="container-fluid py-4 py-md-5 animate-fade-in text-end" dir="rtl">
            {/* 🚀 متجاوب: flex-wrap */}
            <div className="d-flex justify-content-between align-items-center mb-4 mb-md-5 flex-wrap gap-3">
                <div>
                    <h2 className="fw-bold mb-1 text-dark fs-3">إدارة المحتوى</h2>
                    <p className="text-muted small mb-0">اختر الخدمة لعرض أو إضافة سجلات جديدة.</p>
                </div>
                <button className="btn btn-primary shadow-sm d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto py-2" onClick={() => navigate('/admin/services/create')}>
                    <PlusLg /> إنشاء خدمة جديدة
                </button>
            </div>
            
            <div className="position-relative mb-4">
                <Search className="position-absolute top-50 translate-middle-y text-muted me-3" style={{right: '10px'}} />
                <input 
                    type="text" 
                    className="form-control form-control-lg ps-5 rounded-pill shadow-sm border-0" 
                    placeholder="ابحث عن خدمة..."
                    style={{ paddingRight: '40px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="row g-3 g-md-4">
                {filteredServices.length === 0 ? (
                    <div className="col-12 text-center text-muted p-4 p-md-5 bg-light rounded-4 border border-dashed">
                        <Collection size={40} className="mb-3 opacity-25" />
                        <h5>لا توجد خدمات مطابقة</h5>
                        <p className="small">حاول البحث بكلمة أخرى أو أضف خدمة جديدة.</p>
                    </div>
                ) : (
                    filteredServices.map(service => (
                        <div key={service.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <div className="card h-100 shadow-sm border-0 cursor-pointer hover-scale transition-all" onClick={() => navigate(`/admin/posts/${service.slug}`)}>
                                <div className="card-body text-center p-3 p-md-4">
                                    <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{width: 60, height: 60}}>
                                        <Collection size={24} />
                                    </div>
                                    <h5 className="card-title fw-bold text-dark">{service.title}</h5>
                                    <p className="text-muted small text-truncate mb-2">{service.description || "لا يوجد وصف"}</p>
                                    <span className="badge bg-light text-secondary mt-2 border d-block text-truncate" dir="ltr">
                                        Slug: {service.slug}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PostServiceSelectionPage;