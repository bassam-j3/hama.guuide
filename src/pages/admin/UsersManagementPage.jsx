import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge } from 'react-bootstrap';
import { PersonPlus, PencilSquare, Trash, PersonBadge, Envelope, Telephone, ShieldLock, People } from 'react-bootstrap-icons';
import { userService } from '../../api/services/userService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../../utils/errorHelper';

const UsersManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 10;

    const initialFormState = { userName: '', email: '', phoneNumber: '', password: '', roles: ['Admin'] };
    const [formData, setFormData] = useState(initialFormState);

    const loadUsers = async (page = currentPage, isRefetch = false) => {
        if (!isRefetch) setLoading(true);
        else setIsRefetching(true);
        setError(null);
        try { 
            const data = await userService.getAllUsers(page, pageSize); 
            const userList = data?.items || (Array.isArray(data) ? data : []);
            
            setUsers(userList);

            const total = data?.totalCount ?? userList.length;
            const pages = data?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));

            setTotalCount(total);
            setTotalPages(pages);
            setCurrentPage(page);
        } catch (err) { 
            setError(extractErrorMessage(err)); 
        } finally { 
            if (!isRefetch) setLoading(false);
            else setIsRefetching(false);
        }
    };

    useEffect(() => { loadUsers(1); }, []);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            loadUsers(page, true);
        }
    };

    const handleShow = (user = null) => {
        setError(null);
        if (user) {
            setIsEditing(true); setCurrentUser(user);
            setFormData({ userName: user.userName || '', email: user.email || '', phoneNumber: user.phoneNumber || '', password: '', roles: user.roles && user.roles.length > 0 ? user.roles : ['Admin'] });
        } else {
            setIsEditing(false); setCurrentUser(null); setFormData(initialFormState);
        }
        setShowModal(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`حذف المستخدم "${name}"؟`)) return;
        try { 
            await userService.deleteUser(id); 
            if (users.length === 1 && currentPage > 1) {
                await loadUsers(currentPage - 1, true);
            } else {
                await loadUsers(currentPage, true);
            }
            toast.success("تم حذف المستخدم بنجاح.");
        } catch (err) { 
            toast.error(extractErrorMessage(err)); 
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (isEditing) {
                await userService.updateUser(currentUser.id, formData);
            } else {
                await userService.createUser(formData);
            }
            await loadUsers(isEditing ? currentPage : 1, true);
            setShowModal(false);
            setCurrentUser(null);
            setFormData(initialFormState);
            toast.success(isEditing ? "تم تعديل المستخدم بنجاح." : "تم إضافة المستخدم بنجاح.");
        } catch (err) {
            const errorMessage = extractErrorMessage(err) || err.userFriendlyMessage || err.message;
            if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('\n')) {
                errorMessage.split('\n').map(s => s.trim()).filter(Boolean).forEach(msg => toast.error(msg));
            } else if (errorMessage) {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) return <LoadingSpinner message="جاري تحميل المستخدمين..." />;

    return (
        <div className="users-page animate-fade-in text-end" dir="rtl">
            {/* 🚀 متجاوب: flex-wrap */}
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 p-md-4 rounded-3 shadow-sm border flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary d-flex align-items-center gap-2"><People /> إدارة المستخدمين</h3>
                    <p className="text-muted small mb-0">نظام إدارة الصلاحيات والحسابات ({totalCount} مستخدم).</p>
                </div>
                <button className="btn btn-primary btn-sm px-4 py-2 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2 w-100 w-md-auto" onClick={() => handleShow(null)}>
                    <PersonPlus size={18} /> إضافة مستخدم
                </button>
            </div>

            {error && <ErrorMessage message={error} onRetry={loadUsers} />}

            {!error && (
                <>
                    <div className={`card border-0 shadow-sm rounded-3 overflow-hidden ${isRefetching ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.2s' }}>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light text-secondary small text-uppercase">
                                    <tr>
                                        <th className="ps-3 ps-md-4 py-3">المستخدم</th>
                                        <th className="py-3">الدور (Role)</th>
                                        {/* 🚀 إخفاء معلومات الاتصال في الجوال لتوفير المساحة */}
                                        <th className="py-3 d-none d-md-table-cell">معلومات الاتصال</th>
                                        <th className="text-center py-3">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? users.map(user => (
                                        <tr key={user.id}>
                                            <td className="ps-3 ps-md-4">
                                                <div className="d-flex align-items-center gap-2 gap-md-3">
                                                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: 40, height: 40}}><PersonBadge size={20} /></div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{user.userName}</div>
                                                        {/* 🚀 إظهار الإيميل تحت الاسم في الجوال فقط */}
                                                        <div className="d-block d-md-none small text-muted text-truncate" style={{maxWidth:'150px'}}>{user.email}</div>
                                                        <small className="text-muted d-none d-md-block" style={{fontSize: '0.7rem'}}>ID: {user.id.substring(0,6)}..</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {user.roles && user.roles.map((role, idx) => (
                                                    <Badge key={idx} bg={role === 'SuperAdmin' ? 'danger' : (role === 'Admin' ? 'success' : (role === 'ServiceAdmin' ? 'warning text-dark' : 'secondary'))} className="me-1 px-2 py-1">{role}</Badge>
                                                ))}
                                            </td>
                                            <td className="d-none d-md-table-cell">
                                                <div className="d-flex flex-column small">
                                                    <span className="text-muted mb-1"><Envelope className="me-1"/> {user.email}</span>
                                                    {user.phoneNumber && <span className="text-muted"><Telephone className="me-1"/> {user.phoneNumber}</span>}
                                                </div>
                                            </td>
                                            <td className="text-center px-2">
                                                <div className="d-flex justify-content-center gap-1 gap-md-2">
                                                    <button className="btn btn-sm btn-light border text-primary" onClick={() => handleShow(user)}><PencilSquare /></button>
                                                    <button className="btn btn-sm btn-light border text-danger" onClick={() => handleDelete(user.id, user.userName)}><Trash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan="4" className="text-center py-5 text-muted">لا يوجد مستخدمين.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}


            <Modal show={showModal} onHide={() => setShowModal(false)} centered dir="rtl">
                {/* تم اختصار كود المودال لأنه متجاوب بطبيعته */}
                <Modal.Header className="border-0 pb-0"><Modal.Title className="fw-bold fs-5">{isEditing ? "تعديل مستخدم" : "إضافة مستخدم"}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body className="pt-3">
                        <Form.Group className="mb-3" controlId="formUserName"><Form.Label className="small fw-bold">اسم المستخدم</Form.Label><Form.Control type="text" required value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-3" controlId="formEmail"><Form.Label className="small fw-bold">البريد الإلكتروني</Form.Label><Form.Control type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-3" controlId="formPhoneNumber"><Form.Label className="small fw-bold">رقم الهاتف</Form.Label><Form.Control type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} /></Form.Group>
                        {!isEditing && (
                            <Form.Group className="mb-3" controlId="formPassword"><Form.Label className="small fw-bold">كلمة المرور</Form.Label><Form.Control type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></Form.Group>
                        )}
                        <Form.Group className="mb-3" controlId="formRoles"><Form.Label className="small fw-bold">الدور</Form.Label><Form.Select value={formData.roles[0]} onChange={e => setFormData({...formData, roles: [e.target.value]})}>
                            <option value="Admin">Admin</option><option value="User">User</option><option value="SuperAdmin">SuperAdmin</option><option value="ServiceAdmin">ServiceAdmin</option>
                        </Form.Select></Form.Group>
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>إلغاء</Button>
                        <Button variant="primary" type="submit" disabled={submitting}>{submitting ? "حفظ..." : "تأكيد"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};
export default UsersManagementPage;