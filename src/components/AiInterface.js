import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

const systemPromptFeedback = `You are an AI assistant specialized in generating creative ideas for applications and tools that combine multiple APIs. When presented with a set of APIs, suggest innovative ways to combine them into useful applications or tools. Focus on practical, realizable ideas that leverage the unique features of each API. Keep suggestions concise but specific, highlighting the key features and potential user benefits. If the combination of APIs changes, adapt your suggestions accordingly.`;

const systemPromptSearch = `You are an AI assistant specialized in suggesting relevant APIs for user project ideas. When a user describes their project idea, analyze it and suggest specific APIs that would be helpful in implementing that idea. Consider both obvious and creative API combinations that could enhance the project. Return your response in a specific format:

Selected APIs:
- API Name 1: Brief explanation of how it helps
- API Name 2: Brief explanation of how it helps
(etc.)

Additional Thoughts: A brief explanation of how these APIs would work together.

Only suggest APIs that are in the provided list.`;

const AiInterface = ({ activeNodes, onAddNode, apis }) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userIdea, setUserIdea] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const generateIdea = async (fromUserIdea = false) => {
    if ((!fromUserIdea && activeNodes.length === 0) || (fromUserIdea && !userIdea)) {
      return;
    }

    setIsLoading(true);

    let prompt;
    let systemPrompt;

    if (fromUserIdea) {
      // Create a simplified API list for the AI
      const apiList = apis.map(api => `${api.Name}: ${api.Description}`).join('\n');
      prompt = `Given this list of available APIs:\n${apiList}\n\nThe user wants to build: ${userIdea}\n\nWhat APIs would be most useful for this project?`;
      systemPrompt = systemPromptSearch;
    } else {
      const nodesSummary = activeNodes.map(node => 
        `${node.name}: ${node.description}`
      ).join('\n');
      prompt = `I have the following APIs available:\n${nodesSummary}\n\nSuggest an innovative application or tool that combines these APIs in a useful way. Focus on practical features and user benefits.`;
      systemPrompt = systemPromptFeedback;
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

      // If this was a user idea search, try to add suggested APIs as nodes
      if (fromUserIdea) {
        const apiNames = aiResponse.match(/- (.*?):/g) || [];
        apiNames.forEach(nameMatch => {
          const apiName = nameMatch.slice(2, -1).trim(); // Remove "- " and ":"
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
    if (!searchMode) {
      generateIdea(false);
    }
  }, [activeNodes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userIdea.trim()) {
      setSearchMode(true);
      generateIdea(true);
    }
  };

  return (
    <>
      <div className="ai-interface">
        <h3>API Combination Ideas</h3>
        <div className="ai-response">
          {isLoading ? (
            <p>Generating ideas...</p>
          ) : (
            <div>
              {activeNodes.length === 0 && !searchMode ? (
                <p>Drop some API nodes to get application ideas!</p>
              ) : (
                <p>{response}</p>
              )}
            </div>
          )}
        </div>
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
          <button type="submit">Suggest APIs</button>
        </form>
      </div>
    </>
  );
};

export default AiInterface;