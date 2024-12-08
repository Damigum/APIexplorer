import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import MessageInput from './MessageInput';
import ReactMarkdown from 'react-markdown';
import { getCategoryColor, groupedCategories } from '../categoryData';
import { initialPrompt, apiSuggestionPrompt, technicalPrompt, apiCheckPrompt } from '../prompts/systemPrompts';

const Message = ({ content, type, onAddApi, apis, allApis }) => {
  const findMatchingApi = (suggestedName) => {
    let api = allApis.find(api => api.Name === suggestedName);
    
    if (!api) {
      api = allApis.find(api => 
        api.Name.toLowerCase() === suggestedName.toLowerCase()
      );
    }
    
    if (!api) {
      api = allApis.find(api => 
        api.Name.toLowerCase().includes(suggestedName.toLowerCase()) ||
        suggestedName.toLowerCase().includes(api.Name.toLowerCase())
      );
    }
    
    return api;
  };

  const renderApiButton = (apiName, isExisting) => {
    const apiData = findMatchingApi(apiName);
    
    if (!apiData) {
      return (
        <span 
          className="api-suggestion-button api-suggestion-disabled"
          title="API not available"
          style={{ background: '#gray' }}
        >
          {apiName} (Unavailable)
        </span>
      );
    }
    
    const isAlreadyAdded = apis.some(api => api.name === apiData.Name);
    
    return (
      <button
        key={apiName}
        onClick={() => !isAlreadyAdded && onAddApi(apiData)}
        className={`api-suggestion-button ${isAlreadyAdded ? 'api-suggestion-disabled' : ''}`}
        disabled={isAlreadyAdded}
        style={{ 
          background: getCategoryColor(apiData.Category)
        }}
      >
        {isAlreadyAdded ? `${apiData.Name} (Added)` : apiData.Name}
      </button>
    );
  };

  const processText = (text) => {
    if (typeof text !== 'string') return text;
    
    const apiParts = text.split(/(\[\[[^\]]+\]\])/);
    return apiParts.map((part, i) => {
      const match = part.match(/\[\[(.*?)\]\]/);
      if (match) {
        const apiName = match[1];
        const isExisting = apis.some(api => api.name === apiName);
        return renderApiButton(apiName, isExisting);
      }
      return part;
    });
  };

  const renderContent = (content) => {
    if (type === 'assistant') {
      return (
        <ReactMarkdown
          components={{
            p: ({children}) => (
              <p className="mb-4">
                {Array.isArray(children) 
                  ? children.map((child, index) => (
                      <span key={`p-span-${index}`}>{processText(child)}</span>
                    ))
                  : processText(children)}
              </p>
            ),
            h3: ({children}) => (
              <div className="heading-with-button">
                <h3 className="text-lg font-bold mt-6 mb-3">
                  {children}
                </h3>
              </div>
            ),
            ul: ({children}) => (
              <ul className="list-disc pl-6 mb-4">
                {children}
              </ul>
            ),
            li: ({children}) => (
              <li className="mb-2">
                {Array.isArray(children)
                  ? children.map((child, index) => (
                      <span key={`li-span-${index}`}>{processText(child)}</span>
                    ))
                  : processText(children)}
              </li>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }
    return content;
  };

  return (
    <div className={`message ${type}`}>
      {renderContent(content)}
    </div>
  );
};

const EnhancedAiInterface = ({ 
  activeNodes, 
  onAddNode, 
  onRemoveNode,
  apis, 
  setIsInterfaceExpanded,
  isCollapsed,
  isExpanded,
  isDraggingApiCard,
  freeApis
}) => {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponses, setAiResponses] = useState(() => {
    const savedResponses = localStorage.getItem('aiResponses');
    return savedResponses ? JSON.parse(savedResponses) : [];
  });
  const [currentResponseIndex, setCurrentResponseIndex] = useState(() => {
    const savedIndex = localStorage.getItem('currentResponseIndex');
    return savedIndex ? parseInt(savedIndex) : 0;
  });
  const messagesEndRef = useRef(null);
  const interfaceRef = useRef(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('aiResponses', JSON.stringify(aiResponses));
  }, [aiResponses]);

  useEffect(() => {
    localStorage.setItem('currentResponseIndex', currentResponseIndex.toString());
  }, [currentResponseIndex]);

  // Clear chat history when all APIs are removed
  useEffect(() => {
    if (activeNodes.length === 0) {
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('aiResponses');
      localStorage.removeItem('currentResponseIndex');
      setMessages([]);
      setAiResponses([]);
      setCurrentResponseIndex(0);
    }
  }, [activeNodes.length]);

  const [, drop] = useDrop({
    accept: 'API_CARD',
    drop: (item) => {
      onAddNode(item.api);
      setIsInterfaceExpanded(true);
    },
  });

  useEffect(() => {
    drop(interfaceRef);
  }, [drop]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleRegenerateResponse = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Create initial message based on current APIs
    const initialMessage = {
      role: 'user',
      content: activeNodes.length === 1
        ? `I've added ${activeNodes[0].name} to my workspace. What kind of applications could we build with this?`
        : `I have the following APIs: ${activeNodes.map(node => node.name).join(', ')}. What kind of applications could we build with these?`
    };
    
    // Reset messages and show thinking indicator
    setMessages([initialMessage, { role: 'thinking', content: 'Thinking...' }]);
    
    // Generate new response
    await generateResponse([initialMessage]);
    
    setIsLoading(false);
  };

  const generateResponse = async (newMessages) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setIsInterfaceExpanded(true);

    try {
      // Use initial prompt for business idea generation
      const systemPromptContent = initialPrompt + `\n\nCurrent APIs: ${activeNodes.map(node => `${node.name} (${node.category}): ${node.description}`).join('\n')}`;

      // Call backend endpoint
      const API_URL = 'https://devshii.vercel.app';
      const response = await axios.post(`${API_URL}/api/generate-response`, {
        messages: newMessages,
        systemPrompt: systemPromptContent
      });

      const aiResponse = response.data.response;

      if (!aiResponse) {
        throw new Error('Empty response received from AI');
      }

      const updatedMessages = [...newMessages, { role: 'assistant', content: aiResponse }];
      setMessages(updatedMessages);

      setAiResponses(prev => {
        const newResponses = [...prev, aiResponse];
        setCurrentResponseIndex(newResponses.length - 1);
        return newResponses;
      });

    } catch (error) {
      console.error('Error in Response Generation:', error);
      setError(
        error.message === "Empty response received from AI"
          ? "Failed to generate a response. Please try again."
          : error.response?.status === 429
          ? "Rate limit exceeded. Please wait a moment before trying again."
          : "An error occurred while generating ideas. Please try again later."
      );
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.filter(m => m.role !== 'thinking'));
    }
  };

  const navigateResponses = (direction) => {
    if (direction === 'prev' && currentResponseIndex > 0) {
      setCurrentResponseIndex(prev => prev - 1);
      setMessages([
        { role: 'user', content: messages[0].content },
        { role: 'assistant', content: aiResponses[currentResponseIndex - 1] }
      ]);
    } else if (direction === 'next' && currentResponseIndex < aiResponses.length - 1) {
      setCurrentResponseIndex(prev => prev + 1);
      setMessages([
        { role: 'user', content: messages[0].content },
        { role: 'assistant', content: aiResponses[currentResponseIndex + 1] }
      ]);
    }
  };

  useEffect(() => {
    if (!isCollapsed && activeNodes.length > 0 && !isLoading) {
      const lastAddedNode = activeNodes[activeNodes.length - 1];
      
      // Create initial message based on number of APIs
      const initialMessage = {
        role: 'user',
        content: activeNodes.length === 1
          ? `I've added ${lastAddedNode.name} to my workspace. What kind of applications could we build with this?`
          : `I have the following APIs: ${activeNodes.map(node => node.name).join(', ')}. What kind of applications could we build with these?`
      };
      
      // Reset all chat history and start fresh
      const initialMessages = [initialMessage, { role: 'thinking', content: 'Thinking...' }];
      setMessages(initialMessages);
      generateResponse([initialMessage]);
      setAiResponses([]);
      setCurrentResponseIndex(0);
    }
  }, [activeNodes, isCollapsed]);

  const handleRemoveNode = (api) => {
    onRemoveNode(api);
    if (activeNodes.length <= 1) {
      setIsInterfaceExpanded(false);
    }
  };

  const showInterface = isDraggingApiCard || isExpanded || activeNodes.length > 0;

  return (
    <div 
      ref={interfaceRef}
      className={`enhanced-ai-interface ${showInterface ? 'show' : ''} ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="interface-header">

        <div className="interface-controls">
          <button 
            onClick={handleRegenerateResponse}
            disabled={isLoading}
            className="refresh-button"
            title="Regenerate response"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
      
      <div className="selected-apis-section">
        {activeNodes.map((api, index) => (
          <div 
            key={index} 
            className="mini-api-card"
            style={{ 
              background: getCategoryColor(api.category),
              color: '#fff'
            }}
          >
            <div className="api-name">{api.name}</div>
            <div 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveNode(api);
              }}
            >
              ×
            </div>
          </div>
        ))}
      </div>

      <div className="ai-response">
        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div>
            {messages.length === 0 && !activeNodes.length ? (
              <p>Drop some API cards to get app ideas!</p>
            ) : (
              messages
                .filter(message => message.role !== 'user')
                .map((message, index) => (
                  <Message
                    key={index}
                    type={message.role}
                    content={message.content}
                    onAddApi={onAddNode}
                    apis={activeNodes}
                    allApis={apis}
                  />
                ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAiInterface;