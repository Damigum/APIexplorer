// AiInterface.js
import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

const AiInterface = ({ activeNodes, onAddNode, apis, setIsNodeWindowExpanded, isCollapsed }) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userIdea, setUserIdea] = useState('');
  const [error, setError] = useState(null);

  const generateIdea = async (fromUserIdea = false) => {
    if (fromUserIdea && !userIdea) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNodeWindowExpanded(true);

    let prompt;
    let systemPrompt;

    if (fromUserIdea) {
      const apiList = apis.map(api => `${api.Name}: ${api.Description}`).join('\n');
      prompt = `Given this list of available APIs:\n${apiList}\n\nThe user wants to build: ${userIdea}\n\nWhat APIs would be most useful for this project?`;
      systemPrompt = `You are an AI assistant specialized in suggesting relevant APIs for user project ideas. Format your response in a clear, readable structure as follows:

## Recommended APIs

{For each recommended API, format as:}
### [API Name]
• Purpose: [Brief explanation of how this API serves the project]
• Key Features: [1-2 key features that would be useful]
• Integration: [Brief note on how it fits with other APIs]

## Implementation Overview
[2-3 sentences describing how these APIs would work together]

## Technical Considerations
• [2-3 bullet points about important technical aspects]`;
    } else {
      const nodesSummary = activeNodes.map(node => 
        `${node.name}: ${node.description}`
      ).join('\n');
      prompt = `I have the following APIs:\n${nodesSummary}\n\nSuggest an innovative application or tool that combines these APIs in a useful way.`;
      systemPrompt = `You are an AI assistant specialized in generating creative ideas for applications that combine multiple APIs. Format your response in a clear, structured way as follows:

## Application Concept
[2-3 sentences describing the core idea]

## How It Works
• [Break down the workflow using bullet points]
• [Explain how each API contributes]
• [Describe key interactions between APIs]

## Key Features
• [List 3-4 main features]

## Technical Implementation
• [API Integration Points]
• [Data Flow]
• [Key Considerations]

## User Benefits
• [List 2-3 main benefits]`;
    }

    try {
      const result = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
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
      
      setResponse(aiResponse);

      if (fromUserIdea) {
        const apiNames = aiResponse.match(/### (.*?)(?=<br>)/g) || [];
        apiNames.forEach(nameMatch => {
          const apiName = nameMatch.replace('### ', '').trim();
          const api = apis.find(a => a.Name === apiName);
          if (api) {
            onAddNode(api);
          }
        });
      }
    } catch (error) {
      console.error('Error calling Groq API:', error);
      setError(
        error.response?.status === 429
          ? "Rate limit exceeded. Please wait a moment before trying again."
          : "An error occurred while generating ideas. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCollapsed && activeNodes.length > 0) {
      generateIdea(false);
    }
  }, [activeNodes, isCollapsed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userIdea.trim()) {
      generateIdea(true);
      setUserIdea('');
    }
  };

  return (
    <>
      {!isCollapsed && (
        <div className="ai-interface">
          <h3>API Combination Ideas</h3>
          <div className="ai-response">
            {isLoading ? (
              <p>Generating ideas...</p>
            ) : error ? (
              <div className="error-message" style={{ color: '#e53e3e', padding: '8px', borderRadius: '4px', backgroundColor: '#fff5f5' }}>
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
        </div>
      )}
      <div className="user-idea-input-container">
        <form onSubmit={handleSubmit} className="user-idea-input">
          <input
            type="text"
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Describe your project idea..."
            aria-label="Project idea input"
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