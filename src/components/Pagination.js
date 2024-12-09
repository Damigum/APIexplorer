import React from 'react';

const Pagination = ({ apisPerPage, totalApis, paginate, currentPage }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalApis / apisPerPage);

  // Check if we're on mobile
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // Desktop view calculations (show 3 numbers)
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 2);
  
  // Adjust startPage if we're near the end
  if (endPage - startPage < 2) {
    startPage = Math.max(1, endPage - 2);
  }
  
  // Mobile view calculations
  if (isMobile) {
    startPage = Math.max(1, currentPage - 1);
    endPage = Math.min(totalPages, startPage + 2);
    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const styles = {
    numberContainer: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    pagination: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      listStyle: 'none',
      padding: 0,
    },
  };

  return (
    <div className="pagination-container">
      <ul className="pagination" style={styles.pagination}>
        {currentPage > 1 && (
          <li className="arrow-left">
            <button onClick={() => paginate(currentPage - 1)}>
              ←
            </button>
          </li>
        )}
        
        <div className="number-container" style={styles.numberContainer}>
          {startPage > 1 && (
            <>
              <li>
                <button onClick={() => paginate(1)}>1</button>
              </li>
              {startPage > 2 && <li className="ellipsis">...</li>}
            </>
          )}

          {pageNumbers.map(number => (
            <li key={number} className={number === currentPage ? 'active' : ''}>
              <button onClick={() => paginate(number)}>
                {number}
              </button>
            </li>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <li className="ellipsis">...</li>}
              <li>
                <button onClick={() => paginate(totalPages)}>
                  {totalPages}
                </button>
              </li>
            </>
          )}
        </div>

        {currentPage < totalPages && (
          <li className="arrow-right">
            <button onClick={() => paginate(currentPage + 1)}>
              →
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Pagination;