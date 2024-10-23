// AiInterface.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const systemPromptFeedback = `You are an AI assistant specialized in generating creative ideas for applications and tools that combine multiple APIs. When presented with a set of APIs, suggest innovative ways to combine them into useful applications or tools. Focus on practical, realizable ideas that leverage the unique features of each API. Keep suggestions concise but specific, highlighting the key features and potential user benefits. If the combination of APIs changes, adapt your suggestions accordingly.`;

const AiInterface = ({ activeNodes }) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const generateIdea = async () => {
      if (activeNodes.length === 0) {
        setResponse('');
        return;
      }

      setIsLoading(true);

      const nodesSummary = activeNodes.map(node => 
        `${node.name}: ${node.description}`
      ).join('\n');

      const prompt = `I have the following APIs available:\n${nodesSummary}\n\nSuggest an innovative application or tool that combines these APIs in a useful way. Focus on practical features and user benefits.`;

      try {
        const result = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.1-70b-versatile',
            messages: [
              { role: 'system', content: systemPromptFeedback },
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

        setResponse(result.data.choices[0].message.content);
      } catch (error) {
        console.error('Error calling Groq API:', error);
        setResponse('Error generating idea. Please try again later.');
      }

      setIsLoading(false);
    };

    generateIdea();
  }, [activeNodes]);

  return (
    <div className="ai-interface">
      <h3>API Combination Ideas</h3>
      <div className="ai-response">
        {isLoading ? (
          <p>Generating ideas...</p>
        ) : (
          <div>
            {activeNodes.length === 0 ? (
              <p>Drop some API nodes to get application ideas!</p>
            ) : (
              <p>{response}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiInterface;