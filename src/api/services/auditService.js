// src/api/services/auditService.js

// Mocked data for UI development
const mockAuditLogs = [
    { id: 1, user: "أحمد الإداري", actionType: "إضافة", targetEntity: "قسم: مطاعم", timestamp: "2026-10-04T10:30:00Z" },
    { id: 2, user: "خالد المحرر", actionType: "تعديل", targetEntity: "خدمة: توصيل سريع", timestamp: "2026-10-04T11:15:00Z" },
    { id: 3, user: "سارة المديرة", actionType: "حذف", targetEntity: "بوست: عروض الشتاء", timestamp: "2026-10-04T12:05:00Z" },
    { id: 4, user: "أحمد الإداري", actionType: "إضافة", targetEntity: "مخطط (Schema) لخدمة", timestamp: "2026-10-04T14:20:00Z" },
    { id: 5, user: "النظام", actionType: "تحديث تلقائي", targetEntity: "الأذونات", timestamp: "2026-10-04T16:00:00Z" },
];

export const fetchAuditLogs = async () => {
    // Simulating API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockAuditLogs);
        }, 800);
    });
};
