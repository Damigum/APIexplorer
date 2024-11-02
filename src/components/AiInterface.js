import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const Message = ({ content, type, onAddApi }) => {
  // Format content to handle API suggestions with [[Name]] syntax
  const formatApiSuggestion = (text) => {
    return text.split(/(\[\[[^\]]+\]\])/).map((part, index) => {
      const apiNameMatch = part.match(/\[\[(.*?)\]\]/);
      if (apiNameMatch) {
        const apiName = apiNameMatch[1];
        return (
          <button
            key={index}
            onClick={() => onAddApi(apiName)}
            className="suggestion-tab clickable"
          >
            Add {apiName}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`message ${type}`}>
      {type === 'assistant' ? formatApiSuggestion(content) : content}
    </div>
  );
};

const AiInterface = ({ activeNodes, onAddNode, apis, setIsNodeWindowExpanded, isCollapsed }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const prevNodesRef = useRef([]);
  const prevNodesStringified = useRef('');
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Typing indicator effect
  useEffect(() => {
    if (userInput) {
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userInput]);

  // Get relevant APIs based on user input
  const getRelevantApis = (input, allApis) => {
    const keywords = input.toLowerCase().split(/\s+/);
    return allApis.filter(api => {
      const description = (api.Description || '').toLowerCase();
      const name = (api.Name || '').toLowerCase();
      const category = (api.Category || '').toLowerCase();
      
      // Calculate relevance score
      let score = 0;
      keywords.forEach(keyword => {
        if (name.includes(keyword)) score += 3;
        if (description.includes(keyword)) score += 2;
        if (category.includes(keyword)) score += 1;
      });
      
      return score > 0;
    }).sort((a, b) => {
      // Sort by how closely the API name matches the input
      const aMatch = keywords.some(k => a.Name.toLowerCase().includes(k));
      const bMatch = keywords.some(k => b.Name.toLowerCase().includes(k));
      return bMatch - aMatch;
    }).slice(0, 15);
  };

  const handleApiClick = (apiName) => {
    const api = apis.find(a => a.Name === apiName);
    if (api) {
      onAddNode(api);
    }
  };

  const addMessage = (role, content) => {
    setMessages(prevMessages => [...prevMessages, { role, content }]);
  };

  const generateResponse = async (newMessages, isInitialDrop = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setIsNodeWindowExpanded(true);

    // Get relevant APIs based on the last user message
    const lastUserMessage = newMessages.findLast(msg => msg.role === 'user')?.content || '';
    const relevantApis = getRelevantApis(lastUserMessage, apis);
    const apiList = relevantApis.map(api => `${api.Name}: ${api.Description}`).join('\n');

    // Create a more detailed context about active nodes
    const activeNodesContext = activeNodes.length > 0 
      ? `Currently active nodes in your workspace:\n${activeNodes.map(node => 
          `• ${node.name}: ${node.description}\n  Category: ${node.category}\n  URL: ${node.url}`
        ).join('\n\n')}`
      : 'No APIs currently selected.';

    const systemPrompt = {
      role: 'system',
      content: isInitialDrop ? 
        `You are an AI assistant specialized in generating innovative ideas for applications using APIs. You have access to the following workspace context:

${activeNodesContext}

When suggesting additional APIs to combine with the existing ones, wrap their names in double square brackets like this: [[API Name]].

Available APIs for suggestions:
${apiList}

Guidelines:
- Always acknowledge and reference the currently active APIs in the workspace
- Suggest how new APIs can specifically complement the existing ones
- Explain practical integration possibilities between existing and suggested APIs
- Keep responses concise and focused
- Provide concrete examples of how the APIs can work together` 
        :
        `You are an AI assistant specialized in discussing APIs and their applications. Current workspace context:

${activeNodesContext}

When suggesting APIs, wrap their names in double square brackets like this: [[API Name]].

Available APIs for suggestions:
${apiList}

Guidelines:
- Always acknowledge and build upon the currently active APIs in the workspace
- Focus on practical applications and integration possibilities
- Explain how suggested APIs can complement the existing ones
- Keep responses clear and concise
- Provide specific examples of API combinations`
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
                ? `${msg.content}\n\nRelevant APIs:\n${apiList}`
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

      const aiResponse = result.data.choices[0].message.content;
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

    let retries = 3;
    while (retries > 0) {
      try {
        const messagesToSend = messages
          .filter(m => m.role !== 'thinking')
          .concat([{ role: 'user', content: userMessage }]);
        
        await generateResponse(messagesToSend, false);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          setError('Failed to get response after multiple attempts. Please try again.');
          setMessages(prev => prev.filter(m => m.role !== 'thinking'));
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  useEffect(() => {
    const handleNodeChanges = async () => {
      if (!isCollapsed && activeNodes.length > 0 && !isLoading) {
        const currentNodesString = JSON.stringify(activeNodes);
        
        if (currentNodesString !== prevNodesStringified.current) {
          prevNodesStringified.current = currentNodesString;
          
          const isInitialDrop = prevNodesRef.current.length === 0;
          const initialMessage = {
            role: 'user',
            content: isInitialDrop
              ? `I've added ${activeNodes[activeNodes.length - 1].name} to the workspace. What can I build with it?`
              : `I've added ${activeNodes[activeNodes.length - 1].name} to work with ${prevNodesRef.current.map(n => n.name).join(', ')}. What interesting applications can be built with this combination?`
          };
          
          if (!activeNodes.every(node => prevNodesRef.current.some(prev => prev.name === node.name))) {
            setMessages([]);
          }
          
          prevNodesRef.current = activeNodes;
          
          addMessage('user', initialMessage.content);
          addMessage('thinking', 'Thinking...');
          await generateResponse([initialMessage], isInitialDrop);
        }
      }
    };

    handleNodeChanges();
  }, [activeNodes, isCollapsed, isLoading]);

  return (
    <>
      {!isCollapsed && (
        <div className="ai-interface">
          <h3>API Combination Ideas</h3>
          <div className="ai-response">
            {error ? (
              <div className="error-message">
                {error}
              </div>
            ) : (
              <div>
                {messages.length === 0 ? (
                  <p>Drop some API nodes or describe your project idea to get started!</p>
                ) : (
                  messages.map((message, index) => (
                    <Message
                      key={index}
                      type={message.role}
                      content={message.content}
                      onAddApi={handleApiClick}
                    />
                  ))
                )}
                {isTyping && (
                  <div className="typing-indicator">
                    Assistant is typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
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
      )}
    </>
  );
};

export default AiInterface;