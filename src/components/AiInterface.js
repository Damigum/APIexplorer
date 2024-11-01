// AiInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

const AiInterface = ({ activeNodes, onAddNode, apis, setIsNodeWindowExpanded, isCollapsed }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(null);
  const [previousNodeCount, setPreviousNodeCount] = useState(activeNodes.length);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const addMessage = (role, content) => {
    setMessages(prevMessages => [...prevMessages, { role, content }]);
  };

  const generateResponse = async (newMessages) => {
    if (isLoading) return; // Prevent multiple simultaneous generations
    
    setIsLoading(true);
    setError(null);
    setIsNodeWindowExpanded(true);

    // Create context about current APIs
    const apiContext = `Currently active APIs:\n${activeNodes.map(node => 
      `- ${node.name}: ${node.description}`
    ).join('\n')}`;

    const systemPrompt = {
      role: 'system',
      content: `You are an AI assistant specialized in suggesting and discussing APIs and their combinations for building applications. 
      
${apiContext}

Important: Only suggest ideas using these currently active APIs. If the user asks about APIs that were removed, kindly remind them that those APIs are no longer available and suggest alternatives using the current set.`
    };

    try {
      const result = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [
            systemPrompt,
            ...newMessages.map(msg => ({
              ...msg,
              content: msg.role === 'user' 
                ? `${apiContext}\n\nUser message: ${msg.content}`
                : msg.content
            }))
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let aiResponse = result.data.choices[0].message.content;
      
      // Style the response
      aiResponse = aiResponse.replace(/## (.*?)\n/g, '<h2 style="color: #2d3748; margin: 16px 0 8px 0; font-size: 1.2em;">$1</h2>\n');
      aiResponse = aiResponse.replace(/### (.*?)\n/g, '<h3 style="color: #4a5568; margin: 12px 0 6px 0; font-size: 1.1em;">$1</h3>\n');
      aiResponse = aiResponse.replace(/• (.*?)\n/g, '<div style="margin: 4px 0 4px 12px; position: relative;"><span style="position: absolute; left: -12px; color: #4a5568;">•</span>$1</div>\n');
      aiResponse = aiResponse.replace(/\n/g, '<br>');
      
      addMessage('assistant', aiResponse);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      setError(
        error.response?.status === 429
          ? "Rate limit exceeded. Please wait a moment before trying again."
          : "An error occurred while generating ideas. Please try again later."
      );
    } finally {
      setIsLoading(false);
      // Remove any thinking messages
      setMessages(prev => prev.filter(m => m.role !== 'thinking'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    setUserInput('');

    addMessage('user', userMessage);
    addMessage('thinking', 'Thinking...');

    const messagesToSend = messages.filter(m => m.role !== 'thinking').concat([
      { role: 'user', content: userMessage }
    ]);

    await generateResponse(messagesToSend);
  };

  // Single effect to handle both initial generation and node changes
  useEffect(() => {
    const handleNodeChanges = async () => {
      if (!isCollapsed && activeNodes.length > 0 && !isLoading) {
        const shouldGenerateNew = 
          activeNodes.length !== previousNodeCount || // Nodes changed
          messages.length === 0; // Initial generation

        if (shouldGenerateNew) {
          setPreviousNodeCount(activeNodes.length);
          
          const initialMessage = {
            role: 'user',
            content: 'Please suggest an innovative application or tool that combines these APIs in a useful way.'
          };

          // Only add user message if it's the first generation
          if (messages.length === 0) {
            addMessage('user', initialMessage.content);
          }
          
          addMessage('thinking', 'Thinking...');
          await generateResponse([initialMessage]);
        }
      }
    };

    handleNodeChanges();
  }, [activeNodes.length, isCollapsed]);

  return (
    <>
      {!isCollapsed && (
        <div className="ai-interface">
          <h3>API Combination Ideas</h3>
          <div className="ai-response">
            {error ? (
              <div className="error-message" style={{ color: '#e53e3e', padding: '8px', borderRadius: '4px', backgroundColor: '#fff5f5' }}>
                {error}
              </div>
            ) : (
              <div>
                {messages.length === 0 ? (
                  <p>Drop some API nodes or describe your project idea to get started!</p>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`message ${message.role}`}
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="user-idea-input-container">
        <form onSubmit={handleSubmit} className="user-idea-input">
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
    </>
  );
};

export default AiInterface;