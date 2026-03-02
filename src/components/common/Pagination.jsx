import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // إذا لم يكن هناك صفحات أو صفحة واحدة فقط، لا تظهر أزرار الترقيم
    if (!totalPages || totalPages <= 1) return null;

    // توليد مصفوفة بأرقام الصفحات
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <nav aria-label="Page navigation" className="mt-4 d-flex justify-content-center animate-fade-in">
            <ul className="pagination pagination-sm mb-0 shadow-sm" dir="ltr">
                {/* زر السابق */}
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link px-3 fw-bold text-dark" onClick={() => onPageChange(currentPage - 1)}>
                        &laquo; السابق
                    </button>
                </li>
                
                {/* أرقام الصفحات */}
                {pages.map(page => (
                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button className="page-link px-3" onClick={() => onPageChange(page)}>
                            {page}
                        </button>
                    </li>
                ))}
                
                {/* زر التالي */}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link px-3 fw-bold text-dark" onClick={() => onPageChange(currentPage + 1)}>
                        التالي &raquo;
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;