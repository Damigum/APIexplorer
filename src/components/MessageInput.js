// MessageInput.js
import React, { useState } from 'react';
import { Send } from 'lucide-react';

const MessageInput = ({ onSubmit, isLoading, isExpanded }) => {
  const [userInput, setUserInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    onSubmit(userInput);
    setUserInput('');
  };

  return (
    <div className={`message-input-container ${isExpanded ? 'expanded' : ''}`}>
      <form onSubmit={handleSubmit} className="message-input">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          aria-label="Message input"
          disabled={isLoading}
        />
        <button 
          type="submit"
          aria-label="Send"
          className="send-button"
          disabled={isLoading}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;