import React from 'react';
import { PersonCircle, List } from 'react-bootstrap-icons';
import { authService } from '../../api/services/authConfig';

const Navbar = ({ title, subtitle, toggleSidebar }) => {
  
  // جلب بيانات المستخدم مركزياً
  const userData = authService.getCurrentUser();

  return (
    <nav className="navbar navbar-expand bg-white border-bottom px-3 px-md-4 py-3 sticky-top shadow-sm">
      <div className="container-fluid d-flex justify-content-between align-items-center p-0">
        
        {/* الجانب الأيمن: زر القائمة للجوال + العنوان */}
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light d-lg-none border-0 px-2 py-1 text-dark" onClick={toggleSidebar}>
            <List size={28} />
          </button>
          
          <div className="d-flex flex-column text-end">
            <h5 className="mb-0 fw-bold text-dark tracking-tight">{title || 'لوحة التحكم'}</h5>
            {subtitle && <small className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>{subtitle}</small>}
          </div>
        </div>

        {/* الجانب الأيسر: معلومات المستخدم */}
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2 ps-md-3 border-start-md">
            <div className="text-end d-none d-sm-block">
              <p className="mb-0 small fw-bold text-dark">{userData?.username || 'مدير النظام'}</p>
              <p className="mb-0 text-secondary" style={{ fontSize: '0.7rem' }}>{userData?.role || 'Admin'}</p>
            </div>
            <PersonCircle size={32} className="text-primary opacity-75" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;