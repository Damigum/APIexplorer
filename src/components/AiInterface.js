// AiInterface.js
import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

const AiInterface = ({ activeNodes, onAddNode, apis, setIsNodeWindowExpanded, isCollapsed }) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userIdea, setUserIdea] = useState('');

  const generateIdea = async (fromUserIdea = false) => {
    if ((!fromUserIdea && activeNodes.length === 0) || (fromUserIdea && !userIdea)) {
      return;
    }

    setIsLoading(true);
    setIsNodeWindowExpanded(true);

    let prompt;
    let systemPrompt;

    if (fromUserIdea) {
      const apiList = apis.map(api => `${api.Name}: ${api.Description}`).join('\n');
      prompt = `Given this list of available APIs:\n${apiList}\n\nThe user wants to build: ${userIdea}\n\nWhat APIs would be most useful for this project?`;
      systemPrompt = `You are an AI assistant specialized in suggesting relevant APIs for user project ideas. When a user describes their project idea, analyze it and suggest specific APIs that would be helpful in implementing that idea. Consider both obvious and creative API combinations that could enhance the project. Return your response in a specific format:

Selected APIs:
- API Name 1: Brief explanation of how it helps
- API Name 2: Brief explanation of how it helps
(etc.)

Additional Thoughts: A brief explanation of how these APIs would work together.

Only suggest APIs that are in the provided list.`;
    } else {
      const nodesSummary = activeNodes.map(node => 
        `${node.name}: ${node.description}`
      ).join('\n');
      prompt = `I have the following APIs available:\n${nodesSummary}\n\nSuggest an innovative application or tool that combines these APIs in a useful way. Focus on practical features and user benefits.`;
      systemPrompt = `You are an AI assistant specialized in generating creative ideas for applications and tools that combine multiple APIs. When presented with a set of APIs, suggest innovative ways to combine them into useful applications or tools. Focus on practical, realizable ideas that leverage the unique features of each API. Keep suggestions concise but specific, highlighting the key features and potential user benefits.`;
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

      const aiResponse = result.data.choices[0].message.content;
      setResponse(aiResponse);

      if (fromUserIdea) {
        const apiNames = aiResponse.match(/- (.*?):/g) || [];
        apiNames.forEach(nameMatch => {
          const apiName = nameMatch.slice(2, -1).trim();
          const api = apis.find(a => a.Name === apiName);
          if (api) {
            onAddNode(api);
          }
        });
      }
    } catch (error) {
      console.error('Error calling Groq API:', error);
      setResponse('Error generating idea. Please try again later.');
    }

    setIsLoading(false);
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

  // Only render the input form if collapsed, or the full interface if expanded
  if (isCollapsed) {
    return (
      <div className="user-idea-input">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Describe your project idea..."
            aria-label="Project idea input"
          />
          <button 
            type="submit"
            aria-label="Send"
            className="send-button"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="ai-interface">
      <h3>API Combination Ideas</h3>
      <div className="ai-response">
        {isLoading ? (
          <p>Generating ideas...</p>
        ) : (
          <div>
            {activeNodes.length === 0 && !response ? (
              <p>Drop some API nodes or describe your project idea to get started!</p>
            ) : (
              <p>{response}</p>
            )}
          </div>
        )}
      </div>
      <div className="user-idea-input">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userIdea}
            onChange={(e) => setUserIdea(e.target.value)}
            placeholder="Describe your project idea..."
            aria-label="Project idea input"
          />
          <button 
            type="submit"
            aria-label="Send"
            className="send-button"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiInterface;