const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for generating API-integrated mockups
const systemPromptMockup = `
You are a full-stack web developer creating complete, working web applications. 
Generate a single HTML file that includes embedded CSS and JavaScript for a functional prototype.
The application should:
1. Integrate the specified free APIs
2. Have a modern, responsive design
3. Include error handling and loading states
4. Be ready to run in a browser
5. Use only vanilla JavaScript (no frameworks)

Format the response as a complete, self-contained HTML file with all CSS and JavaScript embedded.
`;

// Endpoint to generate and serve mockup
app.post('/api/create-mockup', async (req, res) => {
  const { businessIdea, activeApis } = req.body;

  if (!businessIdea || !activeApis || activeApis.length === 0) {
    return res.status(400).json({ error: 'Business idea and at least one API are required.' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPromptMockup,
      messages: [{
        role: 'user',
        content: `Create a working web application prototype for this business idea:
${businessIdea}

Using these APIs:
${activeApis.map(api => `- ${api.name}: ${api.description} (${api.url})`).join('\n')}

Requirements:
1. Create a complete, self-contained HTML file
2. Include modern, responsive CSS
3. Implement API integration with JavaScript
4. Add error handling and loading states
5. Make it visually appealing and user-friendly

Important: All API calls must be proxied through http://localhost:5000/api/proxy to avoid CORS issues.
Example API call:
fetch('http://localhost:5000/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'THE_API_ENDPOINT',
    method: 'GET'
  })
})

The application should demonstrate the core functionality described in the business idea.`
      }]
    });

    const mockupCode = message.content[0].text;

    // Create a route to serve the mockup
    const mockupPath = `/mockup/${Date.now()}`;
    
    // Add proxy endpoint for the mockup
    app.post('/api/proxy', async (req, res) => {
      const { url, method, data, headers } = req.body;
      try {
        const response = await axios({
          url,
          method,
          data,
          headers: {
            ...headers,
            'Origin': 'http://localhost:5000'
          }
        });
        res.json(response.data);
      } catch (error) {
        console.error('Proxy error:', error);
        res.status(error.response?.status || 500).json({
          error: 'Error fetching from external API',
          details: error.message
        });
      }
    });

    app.get(mockupPath, (req, res) => {
      res.send(mockupCode);
    });

    res.json({ 
      mockupUrl: `http://localhost:${PORT}${mockupPath}`,
      mockupCode 
    });

  } catch (error) {
    console.error('Error generating mockup:', error);
    res.status(500).json({ 
      error: 'Error generating mockup',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 