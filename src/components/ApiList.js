import React from 'react';
import ApiCard from './ApiCard';

const ApiList = ({ apis, getCategoryColor }) => {
  return (
    <div className="api-list">
      {apis.map((api, index) => {
        // Check if api is defined and has necessary properties
        if (api && api.Name && api.Description) {
          return (
            <ApiCard 
              key={index} 
              api={api} 
              getCategoryColor={getCategoryColor} 
            />
          );
        }
        // If api is invalid, don't render anything
        return null;
      })}
    </div>
  );
};

export default ApiList;
