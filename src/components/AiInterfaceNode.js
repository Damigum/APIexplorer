import React from 'react';
import { Handle } from 'react-flow-renderer';
import { Send } from 'lucide-react';

const AiInterfaceNode = ({ data }) => {
  const {
    response,
    isLoading,
    error,
    userIdea,
    setUserIdea,
    handleSubmit,
    activeNodes,
  } = data;

  return (
    <div 
      className="ai-node"
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '16px',
        width: '400px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
      }}
    >
      <Handle type="target" position="left" />
      
      <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', color: '#333' }}>
        API Combination Ideas
      </h3>

      <div 
        className="ai-response"
        style={{
          maxHeight: '200px',
          overflowY: 'auto',
          marginBottom: '16px',
        }}
      >
        {isLoading ? (
          <p>Generating ideas...</p>
        ) : error ? (
          <div style={{ color: '#e53e3e', padding: '8px', borderRadius: '4px', backgroundColor: '#fff5f5' }}>
            {error}
          </div>
        ) : (
          <div>
            {activeNodes.length === 0 && !response ? (
              <p>Drop some API nodes or describe your project idea to get started!</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: response }} />
            )}
          </div>
        )}
      </div>

      <form 
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={userIdea}
          onChange={(e) => setUserIdea(e.target.value)}
          placeholder="Describe your project idea..."
          aria-label="Project idea input"
          disabled={isLoading}
          style={{
            flexGrow: 1,
            padding: '8px 12px',
            border: '1px solid #000000',
            borderRadius: '15px',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '0.9em',
            backgroundColor: 'white',
            color: '#333',
          }}
        />
        <button 
          type="submit"
          aria-label="Send"
          className="send-button"
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            minWidth: '36px',
            height: '36px',
            border: '1px solid #000000',
            backgroundColor: 'white',
            color: '#2e0baf',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
          }}
        >
          <Send size={18} />
        </button>
      </form>

      <Handle type="source" position="right" />
    </div>
  );
};

export default AiInterfaceNode;