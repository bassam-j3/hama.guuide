import React, { useState, useEffect } from 'react';
import { fetchAuditLogs } from '../../api/services/auditService';
import { ShieldCheck, PlusCircle, Pencil, Trash, ClockHistory } from 'react-bootstrap-icons';
import TableSkeleton from '../../components/common/TableSkeleton';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLogs = async () => {
            try {
                const data = await fetchAuditLogs();
                setLogs(data);
            } catch (err) {
                console.error("Failed to load audit logs", err);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, []);

    const getActionIcon = (actionType) => {
        if (actionType.includes('إضافة')) return <PlusCircle className="text-success me-2" />;
        if (actionType.includes('تعديل')) return <Pencil className="text-primary me-2" />;
        if (actionType.includes('حذف')) return <Trash className="text-danger me-2" />;
        return <ShieldCheck className="text-secondary me-2" />;
    };

    const getActionBadge = (actionType) => {
        if (actionType.includes('إضافة')) return "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
        if (actionType.includes('تعديل')) return "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25";
        if (actionType.includes('حذف')) return "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
        return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        }).format(date);
    };

    return (
        <div className="audit-logs-page animate-fade-in text-end" dir="rtl">
            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 p-md-4 rounded-3 shadow-sm border flex-wrap gap-3">
                <div>
                    <h3 className="fw-bold mb-1 text-primary d-flex align-items-center">
                        <ClockHistory className="me-2" /> سجلات التدقيق (Audit Logs)
                    </h3>
                    <p className="text-muted small mb-0">تتبع ومراقبة الإجراءات الحساسة والتعديلات في النظام.</p>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-secondary small text-uppercase">
                            <tr>
                                <th className="px-4 py-3 border-0">المستخدم / الإداري</th>
                                <th className="py-3 border-0">نوع الإجراء</th>
                                <th className="py-3 border-0">الكيان المستهدف</th>
                                <th className="py-3 border-0 text-center">التاريخ والوقت</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-0">
                                        <div className="p-4"><TableSkeleton columns={4} rows={5} /></div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-5 text-muted">لا توجد سجلات تدقيق حتى الآن.</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="border-bottom">
                                        <td className="px-4 py-3 fw-bold text-dark">
                                            {log.user}
                                        </td>
                                        <td className="py-3">
                                            <span className={`badge rounded-pill px-3 py-2 ${getActionBadge(log.actionType)}`}>
                                                {getActionIcon(log.actionType)} {log.actionType}
                                            </span>
                                        </td>
                                        <td className="py-3 text-muted">
                                            {log.targetEntity}
                                        </td>
                                        <td className="py-3 text-center small text-muted font-monospace" dir="ltr">
                                            {formatDate(log.timestamp)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
