import React, { useState } from 'react';
import { useDrag } from 'react-dnd';

const ApiCard = ({ api, getCategoryColor, onDragStart, onDragEnd }) => {
  const [logoError, setLogoError] = useState(false);
  const [{ isDragging }, drag] = useDrag({
    type: 'API_CARD',
    item: () => {
      onDragStart();
      return { api };
    },
    end: () => {
      onDragEnd();
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const handleClick = () => {
    window.open(api.URL, '_blank', 'noopener,noreferrer');
  };

  const categoryColor = api.Category ? getCategoryColor(api.Category) : "#000000";

  // Extract domain from URL
  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return null;
    }
  };

  const domain = getDomain(api.URL);
  const logoUrl = domain ? `https://img.logo.dev/${domain}?token=${process.env.REACT_APP_LOGO_DEV_API_KEY}&format=png&size=50` : null;
  
  return (
    <div
      ref={drag}
      className={`api-card ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="api-logo-container">
        {!logoError && logoUrl && (
          <div className="api-logo">
            <img
              src={logoUrl}
              alt={`${api.Name} logo`}
              onError={() => setLogoError(true)}
              loading="lazy"
            />
          </div>
        )}
      </div>
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



