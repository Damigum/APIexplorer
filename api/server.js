const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://10.0.0.104:3000',
  process.env.ALLOWED_ORIGIN // Your production domain
];

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true); // Allow the request
      } else {
        callback(new Error('Not allowed by CORS')); // Reject the request
      }
    },
  })
);
app.use(express.json());

// Initialize Anthropic SDK
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default system prompt
const systemPromptMockup =
  process.env.SYSTEM_PROMPT_MOCKUP || `Default system prompt here`;

// Route: AI Response Generation
app.post('/api/generate-response', async (req, res) => {
  const { messages, systemPrompt = systemPromptMockup, isUserReply } = req.body;

  try {
    // Primary API call (Groq)
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1000,
        temperature: isUserReply ? 0.7 : 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Return Groq's response
    return res.json({
      response: groqResponse.data.choices[0].message.content,
    });
  } catch (groqError) {
    console.warn('Groq API failed, falling back to OpenRouter', groqError);

    try {
      // Fallback API call (OpenRouter)
      const openRouterResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-coder-32b-instruct',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 1000,
          temperature: isUserReply ? 0.7 : 0.9,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.APP_URL || 'https://your-production-domain.com',
            'X-Title': 'API Explorer',
            'Content-Type': 'application/json',
          },
        }
      );

      // Return OpenRouter's response
      return res.json({
        response: openRouterResponse.data.choices[0].message.content,
      });
    } catch (openRouterError) {
      console.error('Error with OpenRouter fallback:', openRouterError);

      // Final error response
      return res.status(500).json({
        error: 'Failed to generate response from all available providers.',
      });
    }
  }
});

// Server Listener
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

