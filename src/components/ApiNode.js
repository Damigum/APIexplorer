import React from 'react';
import { Handle } from 'react-flow-renderer';
import { X } from 'lucide-react';

const ApiNode = ({ data }) => {
  const { api, getCategoryColor, onRemove } = data;
  const categoryColor = api.Category && getCategoryColor ? getCategoryColor(api.Category) : "#000000";

  return (
    <div className="api-node relative">
      <Handle type="target" position="left" />
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: 'white',
          border: 'none',
          borderRadius: '6px',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          padding: 0,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.background = '#fee2e2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
          e.currentTarget.style.background = 'white';
        }}
        title="Remove node"
      >
        <X size={14} color="#666" />
      </button>
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