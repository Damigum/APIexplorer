import React, { useState } from 'react';
import axios from 'axios';

const systemPromptFeedback = `You are an AI assistant specialized in APIs and web development. Your role is to provide helpful information, explanations, and suggestions related to APIs, their usage, and integration in web applications. Please be concise, accurate, and provide practical advice when possible.`;

const AiInterface = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemPromptFeedback },
            { role: 'user', content: input }
          ],
          max_tokens: 500,
          temperature: 0.3,
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
      console.error('Error calling Groq API:', error.response ? error.response.data : error.message);
      if (error.response) {
        setResponse(`Error: ${error.response.data.error || 'An error occurred while processing your request.'}`);
      } else if (error.request) {
        setResponse('Error: No response from Groq API.');
      } else {
        setResponse('Error: Failed to set up the request.');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="ai-interface">
      <h3>API Assistant</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about APIs or web development..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </form>
      {response && (
        <div className="ai-response">
          <h4>Response:</h4>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default AiInterface;