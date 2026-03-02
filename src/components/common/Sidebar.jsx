import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  House, Grid, Gear, BoxArrowRight, 
  ChevronDown, PatchCheck, Collection, FileText, People, XLg 
} from 'react-bootstrap-icons';

import { fetchAllServices } from '../../api/services/serviceService';
import { fetchAllSections } from '../../api/services/sectionService';
import { authService } from '../../api/services/authConfig';

// --- Custom Hook: جلب البيانات وبناء الشجرة ---
const useSidebarData = () => {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const buildTree = async () => {
            try {
                const [sections, services] = await Promise.all([
                    fetchAllSections().catch(() => []),
                    fetchAllServices().catch(() => [])
                ]);

                const sectionMap = {};
                if (Array.isArray(sections)) {
                    sections.forEach(sec => {
                        sectionMap[sec.id] = { ...sec, children: [], type: 'section' };
                    });
                }

                if (Array.isArray(services)) {
                    services.forEach(srv => {
                        if (srv.sectionId && sectionMap[srv.sectionId]) {
                            sectionMap[srv.sectionId].children.push({ ...srv, type: 'service' });
                        }
                    });
                }

                const rootNodes = [];
                if (Array.isArray(sections)) {
                    sections.forEach(sec => {
                        if (sec.parentId && sectionMap[sec.parentId]) {
                            sectionMap[sec.parentId].children.push(sectionMap[sec.id]);
                        } else {
                            rootNodes.push(sectionMap[sec.id]);
                        }
                    });
                }

                setTree(rootNodes);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        buildTree();
    }, []);

    return { tree, loading };
};

// --- المكون الرئيسي ---
const Sidebar = ({ closeSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tree, loading } = useSidebarData();

    // جلب بيانات المستخدم لمعرفة دوره
    const currentUser = authService.getCurrentUser();
    const isSuperAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.roles?.includes('SuperAdmin');

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // مكون مساعد للروابط الثابتة يغلق القائمة عند الضغط
    const SidebarItem = ({ to, icon, label, end }) => (
        <NavLink 
            to={to} 
            end={end}
            onClick={closeSidebar}
            className={({ isActive }) => 
                `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-2 transition-all mb-1
                ${isActive ? 'bg-primary text-white shadow-sm' : 'text-white-50 hover-bg-dark'}`
            }
        >
            {icon} <span className="small">{label}</span>
        </NavLink>
    );

    const SidebarServiceItem = ({ service, level }) => (
        <NavLink 
            to={`/admin/posts/${service.slug}`}
            onClick={closeSidebar}
            className={({ isActive }) => 
                `d-flex align-items-center gap-2 py-1 px-2 text-decoration-none transition-all rounded-1 mb-1
                ${isActive ? 'bg-success text-white shadow-sm' : 'text-white-50 hover-text-white hover-bg-dark'}`
            }
            style={{ marginLeft: `${level * 12}px`, fontSize: '0.85rem' }}
        >
            <FileText size={14} /> 
            <span className="text-truncate">{service.title}</span>
        </NavLink>
    );

    const SidebarSection = ({ item, level = 0 }) => {
        const isActiveParent = useMemo(() => {
            const checkActive = (node) => {
                if (node.type === 'service') {
                    return location.pathname.includes(`/posts/${node.slug}`);
                }
                if (node.children && node.children.length > 0) {
                    return node.children.some(checkActive);
                }
                return false;
            };
            return checkActive(item);
        }, [item, location.pathname]);

        const [isOpen, setIsOpen] = useState(isActiveParent);

        useEffect(() => {
            if (isActiveParent) setIsOpen(true);
        }, [isActiveParent]);

        if (!item.children || item.children.length === 0) return null;

        return (
            <div className="mb-1">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`nav-link w-100 d-flex align-items-center justify-content-between px-2 py-2 rounded-2 border-0 bg-transparent transition-all
                    ${isActiveParent ? 'text-white' : 'text-white-50 hover-text-white'}`}
                    style={{ paddingLeft: level === 0 ? '1rem' : `${level * 12 + 16}px` }}
                >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                        {level === 0 ? <Collection size={16} className={isActiveParent ? "text-success" : ""} /> : <Grid size={14} />}
                        <span className="small fw-bold">{item.title}</span>
                    </div>
                    <ChevronDown 
                        size={12} 
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} 
                    />
                </button>

                <div className={`overflow-hidden transition-all`} style={{ maxHeight: isOpen ? '1000px' : '0', opacity: isOpen ? 1 : 0 }}>
                    <div className="border-start border-secondary ms-3 ps-2 my-1">
                        {item.children.map(child => (
                            child.type === 'service' 
                            ? <SidebarServiceItem key={child.id} service={child} level={0} />
                            : <SidebarSection key={child.id} item={child} level={level + 1} />
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 text-white h-100">
            {/* الشعار وزر الإغلاق */}
            <div className="d-flex align-items-center justify-content-between mb-4 px-2 pb-3 border-bottom border-secondary">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-success rounded-3 p-2 d-flex align-items-center justify-content-center shadow">
                        <PatchCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h5 className="m-0 fw-bold tracking-tight">HamaGuide</h5>
                        <span className="text-white-50" style={{ fontSize: '0.7rem' }}>
                            {isSuperAdmin ? 'SuperAdmin' : 'Admin'}
                        </span>
                    </div>
                </div>
                <button className="btn btn-link text-white-50 p-0 d-lg-none" onClick={closeSidebar}>
                    <XLg size={20}/>
                </button>
            </div>

            <div className="flex-grow-1 overflow-auto custom-scrollbar pe-2">
                <nav className="nav nav-pills flex-column">
                    <div className="text-uppercase text-white-50 fw-bold mb-2 ps-3" style={{ fontSize: '0.7rem' }}>الرئيسية</div>
                    <SidebarItem to="/admin" icon={<House size={18} />} label="الإحصائيات" end />
                    
                    {/* إظهار هذه القوائم فقط لمدير النظام SuperAdmin */}
                    {isSuperAdmin && (
                        <>
                            <SidebarItem to="/admin/users" icon={<People size={18} />} label="إدارة المستخدمين" />
                            <SidebarItem to="/admin/sections" icon={<Grid size={18} />} label="إدارة الأقسام" />
                            <SidebarItem to="/admin/services" icon={<Gear size={18} />} label="إدارة الخدمات" />

                        </>
                    )}

                    <div className="my-3 border-top border-secondary opacity-25"></div>
                    <div className="text-uppercase text-white-50 fw-bold mb-2 ps-3" style={{ fontSize: '0.7rem' }}>المحتوى</div>
                    
                    {loading ? (
                        <div className="text-center py-4">
                            <span className="spinner-border spinner-border-sm text-success" role="status"></span>
                        </div>
                    ) : tree.length > 0 ? (
                        tree.map(node => (
                            <SidebarSection key={node.id} item={node} />
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
                <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2">
                    <BoxArrowRight size={18} />
                    <span className="small fw-bold">تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;