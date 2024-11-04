import React, { useEffect, useRef, useState } from 'react';
import { Send, Code } from 'lucide-react';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import MessageInput from './MessageInput';
import ReactMarkdown from 'react-markdown';
import { getCategoryColor } from '../categoryData';

const Message = ({ content, type, onAddApi, apis, allApis, onGenerateCode }) => {
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

  const CodeGenerationButton = ({ idea }) => (
    <button
      onClick={() => onGenerateCode(idea)}
      className="code-generation-button"
    >
      <Code size={16} />
      Generate Sample Code
    </button>
  );

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
                {children === 'Business Concepts' && (
                  <CodeGenerationButton idea={content} />
                )}
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
    const activeApiCategories = new Set(activeApis.map(api => api.category));
    
    return allApis
      .filter(api => {
        if (activeApis.some(active => active.name === api.Name)) {
          return false;
        }

        const description = (api.Description || '').toLowerCase();
        const name = (api.Name || '').toLowerCase();
        const category = (api.Category || '').toLowerCase();

        let score = 0;
        keywords.forEach(keyword => {
          if (name.includes(keyword)) score += 3;
          if (description.includes(keyword)) score += 2;
          if (category.includes(keyword)) score += 1;
        });

        if (activeApiCategories.has(api.Category)) {
          score += 2;
        }

        const complementaryPairs = {
          'Cryptocurrency': ['Finance', 'Business'],
          'Weather': ['Transportation', 'Travel'],
          'News': ['Social', 'Data'],
          'Transportation': ['Maps', 'Weather', 'Location'],
          'Calendar': ['Events', 'Social'],
        };

        activeApiCategories.forEach(activeCategory => {
          if (complementaryPairs[activeCategory]?.includes(api.Category)) {
            score += 1;
          }
        });

        return score > 0;
      })
      .sort((a, b) => {
        const aScore = activeApiCategories.has(a.Category) ? 2 : 1;
        const bScore = activeApiCategories.has(b.Category) ? 2 : 1;
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
${activeNodesContext}
${suggestedApisContext}

Guidelines for responses:
1. Structure your responses clearly with markdown headings
2. Be thorough yet concise in your analysis
3. Use bullet points for better readability
4. Save API suggestions for the end, only if relevant

When responding, follow this structure:

### Initial Exploration
- Brief overview of the combined API capabilities
- Key opportunities and synergies
- Potential market gaps to address

### Business Concepts
For each concept:
- Clear problem statement
- Target audience analysis
- Revenue model
- Unique value proposition
- Technical feasibility

### Market Analysis
- Market size and trends
- Competitive landscape
- Growth opportunities

### Next Steps
- Implementation considerations
- Key challenges to address
- Suggested development phases

### Potential API Enhancements (Optional)
Only if relevant to the discussion, suggest 1-2 APIs using [[API Name]] syntax with clear justification.

Example response:
"### Initial Exploration
The combination of Weather API and Transportation data creates powerful opportunities for optimizing travel experiences and logistics operations.
- Real-time weather integration with route planning
- Predictive analytics for travel disruptions
- Enhanced safety through weather-aware navigation

### Business Concepts

1. Smart Route Optimization Platform
   - Problem: Logistics companies struggle with weather-related delays
   - Target: Fleet managers and logistics companies
   - Revenue: Tiered subscription model
   - Value Prop: AI-powered weather-aware route optimization
   - Technical: Feasible with current API capabilities

[Additional concepts...]"

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

  const showInterface = isDraggingApiCard || isExpanded || activeNodes.length > 0;

  const handleGenerateCode = async (businessIdea) => {
    const freeApisInUse = activeNodes.filter(node => 
      freeApis.includes(node.name)
    );

    if (freeApisInUse.length === 0) {
      addMessage('assistant', "Please use at least one free API to generate a code example.");
      return;
    }

    addMessage('thinking', 'Generating web application...');

    try {
      const response = await axios.post('http://localhost:5000/api/create-mockup', {
        businessIdea,
        activeApis: freeApisInUse
      });

      const { mockupUrl, mockupCode } = response.data;

      addMessage('assistant', `
### Generated Web Application

The application has been generated and is ready to view. You can:
1. View the live application: [Open Application](${mockupUrl})
2. Review the source code below

### Source Code
\`\`\`html
${mockupCode}
\`\`\`

### Launch Application
<button onclick="window.open('${mockupUrl}', '_blank')" class="launch-preview-button">
  Launch Application
</button>
`);

    } catch (error) {
      console.error('Error generating application:', error);
      addMessage('assistant', 'Sorry, there was an error generating the application. Please try again.');
    }

    setMessages(prev => prev.filter(m => m.role !== 'thinking'));
  };

  return (
    <div 
      ref={interfaceRef}
      className={`enhanced-ai-interface ${showInterface ? 'show' : ''} ${isExpanded ? 'expanded' : ''}`}
    >
      <h3>API Combination Ideas</h3>
      
      <div className="selected-apis-section">
        {activeNodes.map((api, index) => (
          <div key={index} className="mini-api-card">
            <div className="api-name">{api.name}</div>
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
                  onGenerateCode={handleGenerateCode}
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