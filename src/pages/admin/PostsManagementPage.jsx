import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash, PencilSquare, PlusLg, ArrowRight, Collection, ArrowClockwise, GeoAltFill, StarFill, ArrowCounterclockwise } from 'react-bootstrap-icons';
import { fetchPostsByServiceSlug, deletePostREST, deletePostRating } from '../../api/services/postService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast';

const PostsManagementPage = () => {
    const { serviceSlug } = useParams();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(null);
    const [error, setError] = useState(null);

    const loadPosts = useCallback(async () => {
        if (!serviceSlug) return;
        setLoading(true); setError(null);
        try { setPosts(await fetchPostsByServiceSlug(serviceSlug) || []); } 
        catch (err) { setError(`تعذر جلب البيانات للخدمة: ${serviceSlug}`); } 
        finally { setLoading(false); }
    }, [serviceSlug]);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    const handleDelete = async (postId, postTitle) => {
        if (!window.confirm(`حذف البوست "${postTitle}"؟`)) return;
        const toastId = toast.loading('جاري الحذف...');
        setIsProcessing(postId);
        try {
            await deletePostREST(serviceSlug, postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            toast.success("تم الحذف بنجاح", { id: toastId });
        } catch (err) { 
            toast.error("فشل الحذف.", { id: toastId });
        } finally { setIsProcessing(null); }
    };

    // 🚀 دالة تصفير التقييم للبوست
    const handleResetRating = async (postId) => {
        if (!window.confirm(`هل أنت متأكد من تصفير تقييمات هذا البوست؟`)) return;
        const toastId = toast.loading('جاري مسح التقييمات...');
        setIsProcessing(`rating-${postId}`);
        try {
            await deletePostRating(postId);
            toast.success("تم تصفير التقييم بنجاح", { id: toastId });
            loadPosts(); // إعادة تحميل للبوستات لجلب التقييم الجديد (0)
        } catch (err) { 
            toast.error("فشل مسح التقييم.", { id: toastId });
        } finally { setIsProcessing(null); }
    };

    const columns = useMemo(() => {
        if (posts.length === 0) return [];
        const keys = new Set();
        posts.slice(0, 5).forEach(post => { if (post.payload) Object.keys(post.payload).forEach(k => keys.add(k)); });
        return Array.from(keys);
    }, [posts]);

    if (loading && !posts.length) return <LoadingSpinner message="جاري جلب البيانات..." />;

    return (
        <div className="posts-management animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2"><Collection className="text-primary" /> {serviceSlug}</h4>
                    <span className="text-muted small">عدد السجلات: {posts.length}</span>
                </div>
                <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
                    <button className="btn btn-light btn-sm border flex-grow-1 flex-md-grow-0" onClick={loadPosts}><ArrowClockwise /></button>
                    <button className="btn btn-outline-secondary btn-sm flex-grow-1 flex-md-grow-0" onClick={() => navigate('/admin/posts')}><ArrowRight className="ms-1" /> رجوع</button>
                    <button className="btn btn-success btn-sm px-3 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto mt-2 mt-md-0" onClick={() => navigate(`/admin/services/${serviceSlug}/posts/create`)}><PlusLg /> إضافة جديد</button>
                </div>
            </div>

            {error && <ErrorMessage message={error} onRetry={loadPosts} />}

            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{minWidth: '750px'}}>
                        <thead className="bg-light text-secondary small text-uppercase">
                            <tr>
                                <th className="ps-3 ps-md-4 py-3">العنوان</th>
                                {columns.map(col => <th key={col} className="py-3">{col}</th>)}
                                {/* 🚀 عمود التقييم الجديد */}
                                <th className="text-center py-3">التقييم</th>
                                <th className="text-center py-3 d-none d-lg-table-cell">التاريخ</th>
                                <th className="text-center py-3">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.length > 0 ? posts.map((post) => (
                                <tr key={post.id}>
                                    <td className="ps-3 ps-md-4 fw-bold text-dark">{post.title}</td>
                                    {columns.map(col => <td key={col} className="small"><SmartCell value={post.payload?.[col]} /></td>)}
                                    
                                    {/* 🚀 إظهار النجوم والتقييم */}
                                    <td className="text-center">
                                        <div className="d-flex align-items-center justify-content-center text-warning fw-bold">
                                            <StarFill className="me-1" size={14}/> 
                                            {post.ratingAvg ? post.ratingAvg.toFixed(1) : '0.0'}
                                        </div>
                                        <div className="small text-muted" style={{fontSize:'0.65rem'}}>({post.ratingCount || 0} تقييم)</div>
                                    </td>

                                    <td className="text-center small text-muted d-none d-lg-table-cell" dir="ltr">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                                    <td className="text-center px-2">
                                        <div className="btn-group btn-group-sm shadow-sm">
                                            <button className="btn btn-white border text-primary" onClick={() => navigate(`/admin/services/${serviceSlug}/posts/edit/${post.id}`)} disabled={isProcessing} title="تعديل"><PencilSquare /></button>
                                            <button className="btn btn-white border text-warning" onClick={() => handleResetRating(post.id)} disabled={isProcessing} title="تصفير التقييمات"><ArrowCounterclockwise /></button>
                                            <button className="btn btn-white border text-danger" onClick={() => handleDelete(post.id, post.title)} disabled={isProcessing} title="حذف البوست"><Trash /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="100%" className="text-center py-5"><div className="text-muted opacity-50 mb-2"><Collection size={32}/></div><p className="text-muted">لا توجد بيانات. ابدأ بالإضافة الآن.</p></td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SmartCell = React.memo(({ value }) => {
    if (value === null || value === undefined || value === "") return <span className="text-muted opacity-25">-</span>;
    if (typeof value === 'boolean') return value ? "✅" : "❌";
    const valStr = String(value);
    if (valStr.startsWith('[') && valStr.endsWith(']')) {
        try { const arr = JSON.parse(valStr); if (Array.isArray(arr) && arr.length === 2 && typeof arr[0] === 'number') return <span className="badge bg-light text-primary border text-truncate"><GeoAltFill/> إحداثيات</span>; } catch (e) {}
    }
    if (valStr.match(/\.(jpeg|jpg|gif|png|webp)/i) || valStr.includes('amazonaws')) return <img src={valStr} alt="img" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }} className="border" />;
    return <span className="text-truncate d-inline-block" style={{maxWidth: '120px'}} title={valStr}>{valStr}</span>;
});
export default PostsManagementPage;