import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    House, Grid, Gear, BoxArrowRight, 
    ChevronDown, PatchCheck, Collection, FileText, People, XLg, 
    PersonCircle, Diagram3, Folder2Open
} from 'react-bootstrap-icons';

import { fetchAllServices } from '../../api/services/serviceService';
import { fetchAllSections } from '../../api/services/sectionService';
import { userService } from '../../api/services/userService'; // 🚀 استيراد لعمل prefetch للمستخدمين
import { authService } from '../../api/services/authConfig';
import { useAuth } from '../../hooks/useAuth'; 
// 🚀 1. استيراد useQueryClient للتحكم في الكاش
import { useQueryClient } from '@tanstack/react-query'; 

// ... (هوك useSidebarData يبقى كما هو) ...
const useSidebarData = () => {
    // ... (الكود القديم الخاص بك لبناء الشجرة) ...
    // للمحافظة على المساحة، أبقِ كود useSidebarData كما هو عندك بالضبط.
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const buildTree = async () => {
            try {
                const [sections, services] = await Promise.all([fetchAllSections().catch(() => []), fetchAllServices().catch(() => [])]);
                const sectionMap = {};
                if (Array.isArray(sections)) sections.forEach(sec => { sectionMap[sec.id] = { ...sec, children: [], type: 'section' }; });
                if (Array.isArray(services)) services.forEach(srv => { if (srv.sectionId && sectionMap[srv.sectionId]) sectionMap[srv.sectionId].children.push({ ...srv, type: 'service' }); });
                const rootNodes = [];
                if (Array.isArray(sections)) sections.forEach(sec => { if (sec.parentId && sectionMap[sec.parentId]) sectionMap[sec.parentId].children.push(sectionMap[sec.id]); else rootNodes.push(sectionMap[sec.id]); });
                setTree(rootNodes);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        buildTree();
    }, []);
    return { tree, loading };
};

// 🚀 2. إضافة خاصية onMouseEnter للـ SidebarItem
const SidebarItem = ({ to, icon, label, end, closeSidebar, onHover }) => (
    <NavLink 
        to={to} 
        end={end}
        onClick={closeSidebar}
        onMouseEnter={onHover} /* 🚀 تفعيل الحدث عند مرور الماوس */
        className={({ isActive }) => 
            `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-2 transition-all mb-1
            ${isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover-bg-dark hover-text-white'}`
        }
    >
        {icon} <span className="small">{label}</span>
    </NavLink>
);

// ... (SidebarServiceItem و SidebarSection كما هما) ...

const Sidebar = ({ closeSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tree, loading } = useSidebarData();
    const { user, isSuperAdmin } = useAuth(); 
    
    // 🚀 3. جلب الـ QueryClient
    const queryClient = useQueryClient();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // 🚀 4. دوال التحميل المسبق السحرية
    const prefetchSections = () => {
        queryClient.prefetchQuery({ queryKey: ['sections'], queryFn: fetchAllSections });
    };

    const prefetchServices = () => {
        queryClient.prefetchQuery({ queryKey: ['services'], queryFn: fetchAllServices });
    };

    const prefetchUsers = () => {
        // نجلب الصفحة الأولى للمستخدمين تحسباً لذهابه إليها
        queryClient.prefetchQuery({ queryKey: ['users', 1], queryFn: () => userService.getAllUsers(1, 10) });
    };

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 text-white h-100 bg-dark">
            {/* ... (الهيدر والشعار كما هو) ... */}

            <div className="flex-grow-1 overflow-auto custom-scrollbar pe-2 mt-4">
                <nav className="nav nav-pills flex-column gap-1">
                    
                    <div className="text-uppercase text-white-50 fw-bold mb-2 ps-3 mt-1" style={{ fontSize: '0.7rem' }}>الرئيسية</div>
                    <SidebarItem to="/admin" icon={<House size={18} />} label="الإحصائيات" end closeSidebar={closeSidebar} />
                    <SidebarItem to="/admin/profile" icon={<PersonCircle size={18} />} label="الملف الشخصي" closeSidebar={closeSidebar} />
                    
                    {isSuperAdmin && (
                        <>
                            <div className="my-2 border-top border-secondary opacity-25"></div>
                            <div className="text-uppercase text-white-50 fw-bold mb-2 ps-3 mt-2" style={{ fontSize: '0.7rem' }}>إدارة النظام</div>
                            
                            {/* 🚀 5. ربط الدوال بالروابط */}
                            <SidebarItem to="/admin/sections" icon={<Folder2Open size={18} />} label="إدارة الأقسام" closeSidebar={closeSidebar} onHover={prefetchSections} />
                            <SidebarItem to="/admin/services" icon={<Grid size={18} />} label="إدارة الخدمات" closeSidebar={closeSidebar} onHover={prefetchServices} />
                            <SidebarItem to="/admin/schema" icon={<Diagram3 size={18} />} label="إدارة المخططات" closeSidebar={closeSidebar} />
                            <SidebarItem to="/admin/users" icon={<People size={18} />} label="إدارة المستخدمين" closeSidebar={closeSidebar} onHover={prefetchUsers} />
                        </>
                    )}

                    {/* ... (باقي الكود الخاص بإدارة المحتوى والشجرة كما هو) ... */}
                    <div className="my-3 border-top border-secondary opacity-25"></div>
                    <div className="text-uppercase text-white-50 fw-bold mb-2 ps-3" style={{ fontSize: '0.7rem' }}>إدارة المحتوى</div>
                    
                    {loading ? (
                        <div className="text-center py-4">
                            <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                        </div>
                    ) : tree.length > 0 ? (
                        tree.map(node => (
                            <SidebarSection key={node.id} item={node} location={location} closeSidebar={closeSidebar} />
                        ))
                    ) : (
                        <div className="text-center py-3 text-white-50 small">
                            لا توجد بيانات
                        </div>
                    )}
                </nav>
            </div>

            {/* زر تسجيل الخروج */}
            <div className="mt-auto pt-3 border-top border-secondary">
                <button onClick={handleLogout} className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 py-2 transition-all hover-bg-danger hover-text-white border-0">
                    <BoxArrowRight size={18} />
                    <span className="small fw-bold">تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;