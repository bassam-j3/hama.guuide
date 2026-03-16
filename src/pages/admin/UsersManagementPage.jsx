import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Modal, Button, Form, Badge } from 'react-bootstrap';
import { PersonPlus, PencilSquare, Trash, PersonBadge, Envelope, Telephone, People } from 'react-bootstrap-icons';
import { userService } from '../../api/services/userService';
import ErrorMessage from '../../components/common/ErrorMessage';
import Pagination from '../../components/common/Pagination'; 
import TableSkeleton from '../../components/common/TableSkeleton';
import toast from 'react-hot-toast'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const UsersManagementPage = () => {
    const { triggerGlobalRefresh } = useOutletContext(); 
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const initialFormState = { userName: '', email: '', phoneNumber: '', password: '', roles: ['Admin'] };
    const [formData, setFormData] = useState(initialFormState);

    const { data: usersData, isLoading, isError } = useQuery({
        queryKey: ['users', currentPage],
        queryFn: () => userService.getAllUsers(currentPage, PAGE_SIZE),
        placeholderData: (previousData) => previousData, 
    });

    const users = usersData?.items || usersData?.data || usersData || [];
    const totalPages = usersData?.totalPages || 1;

    // 🚀 تحديث معالج الأخطاء لقراءة سبب الرفض من الباك-إند
    const userMutation = useMutation({
        mutationFn: (data) => isEditing ? userService.updateUser(currentUser.id, data) : userService.createUser(data),
        onSuccess: () => {
            toast.success("تم حفظ البيانات بنجاح!");
            queryClient.invalidateQueries(['users']);
            triggerGlobalRefresh();
            setShowModal(false);
        },
        onError: (error) => {
            // 💡 محاولة قراءة الخطأ القادم من الباك-إند (ProblemDetails)
            let errorMessage = "فشل الحفظ! تأكد من صحة البيانات.";
            
            if (error.response?.data?.Errors && error.response.data.Errors.length > 0) {
                // إذا كان الخطأ من نوع مصفوفة أخطاء (مثل خطأ كلمة المرور)
                errorMessage = error.response.data.Errors[0].description;
            } else if (error.response?.data?.detail) {
                // إذا كان الخطأ نصاً مباشراً
                errorMessage = error.response.data.detail;
            }

            toast.error(errorMessage); // عرض السبب الفعلي للمستخدم
        }
    });

    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            toast.success("تم الحذف!");
            queryClient.invalidateQueries(['users']);
            triggerGlobalRefresh();
        }
    });

    const handleShow = (user = null) => {
        if (user) {
            setIsEditing(true); setCurrentUser(user);
            setFormData({ userName: user.userName, email: user.email, phoneNumber: user.phoneNumber, password: '', roles: user.roles || ['Admin'] });
        } else {
            setIsEditing(false); setFormData(initialFormState);
        }
        setShowModal(true);
    };

    if (isLoading && !usersData) return <TableSkeleton columns={4} rows={5} />;

    return (
        <div className="users-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded-3 shadow-sm border">
                <div><h3 className="fw-bold mb-1 text-primary"><People /> إدارة المستخدمين</h3></div>
                <button className="btn btn-primary btn-sm px-4 fw-bold" onClick={() => handleShow(null)}><PersonPlus /> إضافة مستخدم</button>
            </div>

            {isError && <ErrorMessage message="فشل تحميل المستخدمين." />}

            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr><th>المستخدم</th><th>الدور</th><th className="d-none d-md-table-cell">الاتصال</th><th className="text-center">الإجراءات</th></tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2"><PersonBadge size={20} /></div>
                                            <div><div className="fw-bold">{user.userName}</div><small className="text-muted">ID: {user.id.substring(0,6)}</small></div>
                                        </div>
                                    </td>
                                    <td><Badge bg="success">{user.roles?.[0] || 'Admin'}</Badge></td>
                                    <td className="d-none d-md-table-cell small text-muted">{user.email}</td>
                                    <td className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                            <button className="btn btn-sm btn-light text-primary" onClick={() => handleShow(user)}><PencilSquare /></button>
                                            <button className="btn btn-sm btn-light text-danger" onClick={() => {if(window.confirm('حذف؟')) deleteMutation.mutate(user.id)}}><Trash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            <Modal show={showModal} onHide={() => setShowModal(false)} centered dir="rtl">
                <Form onSubmit={(e) => { e.preventDefault(); userMutation.mutate(formData); }}>
                    <Modal.Header><Modal.Title>{isEditing ? "تعديل مستخدم" : "إضافة مستخدم"}</Modal.Title></Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>الاسم</Form.Label>
                            <Form.Control value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>الإيميل</Form.Label>
                            <Form.Control type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        </Form.Group>
                        {!isEditing && (
                            <Form.Group className="mb-3">
                                <Form.Label>كلمة المرور</Form.Label>
                                {/* 🚀 إضافة Regex للتحقق من وجود حرف خاص واحد على الأقل قبل الإرسال للسيرفر */}
                                <Form.Control 
                                    type="password" 
                                    value={formData.password} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    required 
                                    pattern=".*[^a-zA-Z0-9].*" 
                                    title="يجب أن تحتوي كلمة المرور على حرف خاص واحد على الأقل (مثل @, #, $, !)"
                                />
                                <Form.Text className="text-muted small">
                                    يجب أن تحتوي على حروف، أرقام، وحرف خاص واحد على الأقل.
                                </Form.Text>
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)}>إلغاء</Button>
                        <Button variant="primary" type="submit" disabled={userMutation.isPending}>{userMutation.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};
export default UsersManagementPage;