import React, { useState } from 'react';
import { Search, X, Bookmark } from 'lucide-react';
import { groupedCategories } from '../categoryData';

const ApiFilter = ({ onFilterChange, filters, bookmarkedCount, onBookmarkClick, isBookmarkTab }) => {
  const [showCategories, setShowCategories] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    onFilterChange({ ...filters, search: value });
  };

  const handleCategoryClick = (category) => {
    onFilterChange({
      ...filters,
      category: filters.category === category ? '' : category
    });
  };

  const clearSearch = () => {
    setSearchValue('');
    onFilterChange({ ...filters, search: '' });
  };

  const getComputedColor = (color) => {
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      const style = getComputedStyle(document.documentElement);
      const varName = color.match(/var\((.*?)\)/)?.[1];
      if (varName) {
        return style.getPropertyValue(varName).trim() || color;
      }
    }
    return color;
  };

  return (
    <div className="filter-container">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search APIs..."
          value={searchValue}
          onChange={handleSearchChange}
          className="search-input"
        />
        {searchValue && (
          <button onClick={clearSearch} className="clear-search">
            <X size={16} />
          </button>
        )}
        <button 
          className={`category-toggle ${showCategories ? 'active' : ''}`}
          onClick={() => setShowCategories(!showCategories)}
        >
          Categories
        </button>
        <button 
          className={`bookmark-button-search ${isBookmarkTab ? 'active' : ''}`}
          onClick={onBookmarkClick}
        >
          <Bookmark size={18} />
          {bookmarkedCount > 0 && <span className="bookmark-count">{bookmarkedCount}</span>}
        </button>
      </div>
      
      {showCategories && (
        <div className="category-drawer">
          <div className="category-chips">
            {Object.entries(groupedCategories).map(([mainCategory, { color, subcategories }]) => (
              subcategories.map(subCategory => {
                const computedColor = getComputedColor(color);
                return (
                  <button
                    key={subCategory}
                    onClick={() => handleCategoryClick(subCategory)}
                    className={`category-chip ${filters.category === subCategory ? 'active' : ''}`}
                    style={{
                      '--category-color': computedColor,
                      backgroundColor: filters.category === subCategory ? computedColor : `${computedColor}22`,
                      color: filters.category === subCategory ? 'white' : computedColor,
                      borderColor: computedColor
                    }}
                  >
                    {subCategory}
                  </button>
                );
              })
            ))}
          </div>
        </div>
      )}

      <style>{`
        .filter-container {
          max-width: 900px;
          margin: 0 auto 20px;
          padding: 0 20px;
        }

        .search-bar {
          position: relative;w
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          margin-top: 0.5%;
        }

        .search-input {
          flex-grow: 1;
          padding: 8px 36px;
          border: 1px solid #000000;
          border-radius: 5px;
          font-family: 'Tiny5', sans-serif;
          font-weight: 400;
          font-size: 0.9em;
          background-color: white;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          z-index: 1;
          pointer-events: none;
        }

        .clear-search {
          position: absolute;
          right: 140px;
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        @media screen and (max-width: 768px) {
          .search-bar {
            flex-wrap: wrap;
            gap: 8px;
          }

          .search-input {
            width: 100%;
            order: 1;
          }

          .search-icon {
            position: absolute;
            left: 12px;
            top: 9px;
            transform: none;
          }

          .clear-search {
            right: 12px;
            top: 11px;
          }

          .category-toggle,
          .bookmark-button-search {
            order: 2;
          }
        }

        .category-toggle {
          padding: 8px 16px;
          border: 1px solid #000000;
          border-radius: 5px;
          background: white;
          font-family: 'rubik', sans-serif;
          font-weight: 400;
          font-size: 0.9em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-toggle:hover,
        .category-toggle.active {
          background-color: #ffd900;
          color: rgb(0, 0, 0);
        }

        .category-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          background-color: #eaf0f5;
          justify-content: center;
          align-items: center;
          padding: 10px;
          max-width: 800px;
          margin: 0 auto;
        }

        .category-chip {
          padding: 4px 12px;
          border: 1px solid;
          border-radius: 15px;
          font-family: 'Rubik', sans-serif;
          font-size: 0.75em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        .category-chip:hover {
          transform: translateY(-1px);
          filter: brightness(0.95);
        }

        @media (max-width: 768px) {
          .filter-container {
            padding: 0 10px;
          }

          .search-bar {
            position: relative;
            flex-wrap: wrap;
          }

          .search-input {
            width: 100%;
            padding-right: 40px;
          }

          .clear-search {
            right: 12px;
          }

          .category-toggle {
            width: 100%;
            margin-top: 8px;
          }
        }

        .bookmark-button-search {
          padding: 8px 16px;
          border: 1px solid #000000;
          border-radius: 5px;
          background: white;
          font-family: 'rubik', sans-serif;
          font-weight: 400;
          font-size: 0.9em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .bookmark-button-search.active {
          background-color: #ffd900;
          color: rgb(0, 0, 0);
        }
      `}</style>
    </div>
  );
};

export default ApiFilter; 