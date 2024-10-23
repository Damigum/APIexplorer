import React from 'react';
import { useDrag } from 'react-dnd';

const ApiCard = ({ api, getCategoryColor, onDragStart, onDragEnd }) => {
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

  return (
    <div
      ref={drag}
      className={`api-card ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
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




