// src/components/ApiNode.js
import React from 'react';
import { Handle } from 'react-flow-renderer';

const ApiNode = ({ data }) => {
  const { api } = data;
  const categoryColor = api.Category ? data.getCategoryColor(api.Category) : "#000000";

  return (
    <div className="api-node">
      <Handle type="target" position="left" />
      <div className="api-node-content">
        <div className="api-node-name">{api.Name}</div>
        {api.Category && (
          <div className="category" style={{ '--category-color': categoryColor }}>
            {api.Category}
          </div>
        )}
        <div className="api-node-description">{api.Description}</div>
      </div>
      <Handle type="source" position="right" />
    </div>
  );
};

export default ApiNode;




