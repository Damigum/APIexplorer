import React from 'react';

const Pagination = ({ apisPerPage, totalApis, paginate, currentPage }) => {
  const totalPages = Math.ceil(totalApis / apisPerPage);

  // Calculate the 3 numbers to show
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 2);
  
  // Adjust startPage if we're near the end
  if (endPage - startPage < 2) {
    startPage = Math.max(1, endPage - 2);
  }

  const pageNumbers = [];
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
          {pageNumbers.map(number => (
            <li key={number} className={number === currentPage ? 'active' : ''}>
              <button onClick={() => paginate(number)}>
                {number}
              </button>
            </li>
          ))}
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