import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Trash, PencilSquare, PlusLg, ArrowRight, Collection, ArrowClockwise, GeoAltFill, StarFill, ArrowCounterclockwise } from 'react-bootstrap-icons';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast';

import { usePostsBySlug, useDeletePost, useResetPostRating } from '../../hooks/api/usePosts';
import { useQueryClient } from '@tanstack/react-query'; 

// 🚀 أداة الـ Toast المخصصة
import { confirmAction } from '../../utils/alerts';

const PostsManagementPage = () => {
    const { serviceSlug } = useParams();
    const navigate = useNavigate();
    const { triggerGlobalRefresh } = useOutletContext(); 
    const queryClient = useQueryClient();

    const [isProcessing, setIsProcessing] = useState(null); 

    const { data: postsData, isLoading, isError } = usePostsBySlug(serviceSlug);
    const deleteMutation = useDeletePost(serviceSlug);
    const resetRatingMutation = useResetPostRating(serviceSlug);

    const posts = Array.isArray(postsData) ? postsData : (postsData?.items || postsData?.data || []);

    const handleDelete = async (postId, postTitle) => {
        // 🚀 استخدام Toast بدلاً من window.confirm
        confirmAction(`هل أنت متأكد من حذف البوست "${postTitle}"؟`, async () => {
            setIsProcessing(postId);
            try {
                await deleteMutation.mutateAsync(postId);
                triggerGlobalRefresh(); 
            } finally {
                setIsProcessing(null);
            }
        });
    };

    const handleResetRating = async (postId) => {
        // 🚀 استخدام Toast لعملية تصفير التقييم أيضاً
        confirmAction(`هل أنت متأكد من تصفير تقييمات هذا البوست؟`, async () => {
            setIsProcessing(`rating-${postId}`);
            try {
                await resetRatingMutation.mutateAsync(postId);
                triggerGlobalRefresh(); 
            } finally {
                setIsProcessing(null);
            }
        });
    };

    const columns = useMemo(() => {
        if (!posts || posts.length === 0) return [];
        const keys = new Set();
        posts.slice(0, 5).forEach(post => { 
            if (post.payload) Object.keys(post.payload).forEach(k => keys.add(k)); 
        });
        return Array.from(keys);
    }, [posts]);

    if (isLoading) return <LoadingSpinner message="جاري جلب بيانات الخدمة..." />;

    return (
        <div className="posts-management animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-3 shadow-sm border flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2"><Collection className="text-primary" /> {serviceSlug}</h4>
                    <span className="text-muted small">عدد السجلات: {posts.length}</span>
                </div>
                <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
                    <button className="btn btn-light btn-sm border flex-grow-1 flex-md-grow-0" onClick={() => queryClient.invalidateQueries(['posts', serviceSlug])}><ArrowClockwise /></button>
                    <button className="btn btn-outline-secondary btn-sm flex-grow-1 flex-md-grow-0" onClick={() => navigate('/admin/posts')}><ArrowRight className="ms-1" /> رجوع</button>
                    <button className="btn btn-success btn-sm px-3 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto mt-2 mt-md-0" onClick={() => navigate(`/admin/services/${serviceSlug}/posts/create`)}><PlusLg /> إضافة جديد</button>
                </div>
            </div>

            {isError && <ErrorMessage message={`تعذر جلب البيانات للخدمة: ${serviceSlug}`} onRetry={() => queryClient.invalidateQueries(['posts', serviceSlug])} />}

            {!isError && (
                <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0" style={{minWidth: '750px'}}>
                            <thead className="bg-light text-secondary small text-uppercase">
                                <tr>
                                    <th className="ps-3 ps-md-4 py-3">العنوان</th>
                                    {columns.map(col => <th key={col} className="py-3">{col}</th>)}
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
                                                <button className="btn btn-white border text-warning" onClick={() => handleResetRating(post.id)} disabled={isProcessing === `rating-${post.id}`} title="تصفير التقييمات">
                                                    {isProcessing === `rating-${post.id}` ? <span className="spinner-border spinner-border-sm" /> : <ArrowCounterclockwise />}
                                                </button>
                                                <button className="btn btn-white border text-danger" onClick={() => handleDelete(post.id, post.title)} disabled={isProcessing === post.id} title="حذف البوست">
                                                    {isProcessing === post.id ? <span className="spinner-border spinner-border-sm" /> : <Trash />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="100%" className="text-center py-5"><div className="text-muted opacity-50 mb-2"><Collection size={32}/></div><p className="text-muted">لا توجد بيانات. ابدأ بالإضافة الآن.</p></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
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