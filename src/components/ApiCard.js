import React from 'react';

const ApiCard = ({ api, getCategoryColor }) => {
  const handleClick = () => {
    window.open(api.URL, '_blank', 'noopener,noreferrer');
  };

  const categoryColor = api.Category ? getCategoryColor(api.Category) : "#000000";

  return (
    <div className="api-card" onClick={handleClick}>
      <div className="card_load"></div>
      <div className="api-content">
        <div className="api-name">{api.Name}</div>
        {api.Category && (
          <div className="category" style={{ '--category-color': categoryColor }}>
            {api.Category}
          </div>
        )}
        <div className="api-description">{api.Description}</div>
      </div>
    </div>
  );
};

export default ApiCard;