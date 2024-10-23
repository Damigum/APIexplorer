import React from 'react';
import ApiCard from './ApiCard';

const ApiList = ({ apis, getCategoryColor, onDragStart, onDragEnd }) => {
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
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default ApiList;




