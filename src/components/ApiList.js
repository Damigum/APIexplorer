// src/components/ApiList.js
import React from 'react';
import ApiCard from './ApiCard';

const ApiList = ({ apis, getCategoryColor }) => {
  return (
    <div className="api-list">
      {apis.map((api, index) => {
        if (api && api.Name && api.Description) {
          return (
            <ApiCard
              key={index}
              api={api}
              getCategoryColor={getCategoryColor}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default ApiList;




