import React from 'react';
import ApiCard from './ApiCard';

const ApiList = ({ apis, getCategoryColor, onDragStart, onDragEnd }) => {
  const handleSelect = (api) => {
    window.open(api.URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="api-list">
      {apis.map((api, index) => {
        if (api && api.Name && api.Description) {
          return (
            <ApiCard
              key={`${api.Name}-${index}`}
              api={api}
              getCategoryColor={getCategoryColor}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onSelect={handleSelect}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default ApiList;



