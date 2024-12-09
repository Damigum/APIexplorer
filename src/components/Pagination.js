import React from 'react';

const Pagination = ({ apisPerPage, totalApis, paginate, currentPage }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalApis / apisPerPage);

  // Calculate the range of page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // Adjust startPage if we're near the end
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination-container">
      <ul className="pagination">
        {currentPage > 1 && (
          <li className="arrow-left">
            <button onClick={() => paginate(currentPage - 1)}>
              ←
            </button>
          </li>
        )}
        
        <div className="number-container">
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