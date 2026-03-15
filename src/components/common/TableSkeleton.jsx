import React from 'react';

const TableSkeleton = ({ columns = 4, rows = 5 }) => {
  return (
    <div className="card border-0 shadow-sm rounded-3 overflow-hidden animate-fade-in" dir="rtl">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="bg-light border-bottom">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={`th-${i}`} className="py-3 px-4">
                  <div className="skeleton skeleton-text w-50 mb-0" style={{ height: '12px' }}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={`tr-${rowIndex}`}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={`td-${rowIndex}-${colIndex}`} className="px-4 py-3">
                    {/* العمود الأول غالباً يكون صورة واسم */}
                    {colIndex === 0 ? (
                      <div className="d-flex align-items-center gap-3">
                        <div className="skeleton skeleton-avatar"></div>
                        <div>
                          <div className="skeleton skeleton-text" style={{ width: '120px' }}></div>
                          <div className="skeleton skeleton-text mb-0" style={{ width: '80px', height: '10px' }}></div>
                        </div>
                      </div>
                    ) : /* العمود الأخير غالباً أزرار التحكم */ colIndex === columns - 1 ? (
                      <div className="d-flex justify-content-center gap-2">
                        <div className="skeleton skeleton-button"></div>
                        <div className="skeleton skeleton-button"></div>
                      </div>
                    ) : /* باقي الأعمدة نصوص عادية */ (
                      <div className="skeleton skeleton-text w-75 mb-0"></div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;