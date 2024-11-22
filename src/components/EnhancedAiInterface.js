import React, { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import MessageInput from './MessageInput';
import ReactMarkdown from 'react-markdown';
import { getCategoryColor, groupedCategories } from '../categoryData';

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
      console.log(`API not found: ${apiName}`);
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
                      <span key={index}>{processText(child)}</span>
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
                      <span key={index}>{processText(child)}</span>
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
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const interfaceRef = useRef(null);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const findRelevantApis = (input, activeApis, allApis) => {
    const keywords = input.toLowerCase().split(/\s+/);
    
    // Get the main category groups from groupedCategories
    const mainCategoryGroups = {
      "Technology & Development": ["Business & Finance", "Security", "Open Data"],
      "Business & Finance": ["Technology & Development", "Government & Society", "Social & Personal"],
      "Government & Society": ["Business & Finance", "Open Data", "Social & Personal"],
      "Entertainment & Media": ["Social & Personal", "Arts & Culture", "Education & Knowledge"],
      "Lifestyle & Health": ["Social & Personal", "Nature & Animals", "Transportation & Location"],
      "Education & Knowledge": ["Entertainment & Media", "Science & Math", "Technology & Development"],
      "Arts & Culture": ["Entertainment & Media", "Social & Personal", "Education & Knowledge"],
      "Transportation & Location": ["Nature & Animals", "Lifestyle & Health", "Government & Society"],
      "Nature & Animals": ["Environment", "Science & Math", "Lifestyle & Health"],
      "Utilities & Tools": ["Technology & Development", "Business & Finance", "Education & Knowledge"],
      "Social & Personal": ["Entertainment & Media", "Lifestyle & Health", "Business & Finance"]
    };

    // Helper function to get main category for a subcategory
    const getMainCategory = (subcategory) => {
      for (const [main, { subcategories }] of Object.entries(groupedCategories)) {
        if (subcategories.includes(subcategory)) {
          return main;
        }
      }
      return null;
    };

    // Get active main categories
    const activeMainCategories = new Set(
      activeApis
        .map(api => getMainCategory(api.category))
        .filter(Boolean)
    );

    return allApis
      .filter(api => {
        if (activeApis.some(active => active.name === api.Name)) {
          return false;
        }

        const description = (api.Description || '').toLowerCase();
        const name = (api.Name || '').toLowerCase();
        const apiMainCategory = getMainCategory(api.Category);
        const isAiModel = api.isAiModel;
        
        let score = 0;

        // Boost score for AI models when relevant keywords are present
        if (isAiModel && (
          input.toLowerCase().includes('ai') ||
          input.toLowerCase().includes('model') ||
          input.toLowerCase().includes('machine learning')
        )) {
          score += 2;
        }

        // Keyword matching
        keywords.forEach(keyword => {
          if (name.includes(keyword)) score += 3;
          if (description.includes(keyword)) score += 2;
        });

        // Score complementary categories
        if (apiMainCategory) {
          activeMainCategories.forEach(activeCategory => {
            if (mainCategoryGroups[activeCategory]?.includes(apiMainCategory)) {
              score += 2;
            }
          });
        }

        // Add randomness to encourage diversity
        if (Math.random() < 0.3) {
          score += 2;
        }

        // Boost score for APIs from different main categories
        if (apiMainCategory && !activeMainCategories.has(apiMainCategory)) {
          score += 1;
        }

        return score > 0;
      })
      .sort((a, b) => {
        const randomFactor = Math.random() * 0.4 - 0.2;
        const aMainCategory = getMainCategory(a.Category);
        const bMainCategory = getMainCategory(b.Category);
        
        // Prioritize APIs from different main categories
        const aScore = (!activeMainCategories.has(aMainCategory) ? 3 : 1) + randomFactor;
        const bScore = (!activeMainCategories.has(bMainCategory) ? 3 : 1) + randomFactor;
        
        return bScore - aScore;
      })
      .slice(0, 5);
  };

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

  const generateResponse = async (newMessages) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setIsInterfaceExpanded(true);

    const lastUserMessage = newMessages.findLast(msg => msg.role === 'user')?.content || '';
    const relevantApis = findRelevantApis(lastUserMessage, activeNodes, apis);
    
    const activeNodesContext = activeNodes.length > 0 
      ? `Currently active APIs:\n${activeNodes.map(node => 
          `• ${node.name} (${node.category}): ${node.description}`
        ).join('\n')}`
      : 'No APIs currently selected.';

    const suggestedApisContext = relevantApis.length > 0
      ? `\n\nSuggested complementary APIs:\n${relevantApis.map(api => 
          `• ${api.Name} (${api.Category}): ${api.Description}`
        ).join('\n')}`
      : '';

    const systemPrompt = {
      role: 'system',
      content: `You are an AI assistant specialized in helping users explore innovative ideas and applications. Your primary focus is on understanding their goals and developing creative business concepts.

Current context:
${activeNodes.map(node => {
  const type = node.isAiModel ? 'AI Model' : 'API';
  return `• ${node.name} (${type} - ${node.category}): ${node.description}`;
}).join('\n')}

${suggestedApisContext}

Guidelines for responses:
1. Present ONE business concept at a time
2. Structure your response clearly with markdown headings
3. Be thorough yet concise in your analysis
4. Use bullet points for better readability
5. When suggesting AI models, explain how they complement the APIs

When responding, follow this structure:
### Initial Exploration
Brief overview of the capabilities

### Business Concept
-Problem
Value Prop (two detailed sentences explaining the solution and its unique benefits)
Target audience
Revenue model

### Potential Enhancements (Optional)
Only if relevant to the discussion, suggest 1-2 APIs or AI models using [[Name]] syntax:
- [[Name]] - Brief description of how it enhances the solution
- [[Name]] - Brief description of how it enhances the solution

Remember: Focus on value creation and thorough analysis before suggesting technical solutions.`
    };

    try {
      const result = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [systemPrompt, ...newMessages],
          max_tokens: 1000,
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

  const handleMessageSubmit = async (message) => {
    if (isLoading) return;
    
    addMessage('user', message);
    addMessage('thinking', 'Thinking...');

    let retries = 3;
    while (retries > 0) {
      try {
        const messagesToSend = messages
          .filter(m => m.role !== 'thinking')
          .concat([{ role: 'user', content: message }]);
        
        await generateResponse(messagesToSend);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          setError('Failed to get response after multiple attempts. Please try again.');
          setMessages(prev => prev.filter(m => m.role !== 'thinking'));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  useEffect(() => {
    if (!isCollapsed && activeNodes.length > 0 && !isLoading) {
      const lastAddedNode = activeNodes[activeNodes.length - 1];
      const initialMessage = {
        role: 'user',
        content: activeNodes.length === 1
          ? `I've added ${lastAddedNode.name} to my workspace. What kind of applications or business ideas could we build with this?`
          : `I've added ${lastAddedNode.name} to work with my existing APIs. How could this enhance our application idea?`
      };
      
      setMessages([]);
      addMessage('user', initialMessage.content);
      addMessage('thinking', 'Thinking...');
      generateResponse([initialMessage]);
    }
  }, [activeNodes, isCollapsed]);

  const handleRemoveNode = (api) => {
    onRemoveNode(api);
    // If this was the last API, collapse the interface
    if (activeNodes.length === 1) {
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
        <h3>API Combination Ideas</h3>
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
            {messages.length === 0 ? (
              <p>Drop some API cards or describe your project idea to get started!</p>
            ) : (
              messages.map((message, index) => (
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
            {isTyping && (
              <div className="typing-indicator">Assistant is typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <MessageInput 
        onSubmit={handleMessageSubmit}
        isLoading={isLoading}
        isExpanded={isExpanded}
      />
    </div>
  );
};

export default EnhancedAiInterface;