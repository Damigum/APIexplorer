// ApiSuggestion.js
import React from 'react';

const ApiSuggestion = ({ apiName, description, onClick, isClickable }) => {
  return (
    <div className="api-suggestion">
      {isClickable ? (
        <button
          className="suggestion-tab clickable"
          onClick={onClick}
          aria-label={`Add API ${apiName}`}
        >
          {apiName}
        </button>
      ) : (
        <span className="suggestion-tab-disabled">
          {apiName}
        </span>
      )}
      <div className="api-suggestion-description">
        {description}
      </div>
    </div>
  );
};

export default ApiSuggestion;