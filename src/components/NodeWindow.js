import React, { useRef, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
} from 'react-flow-renderer';
import { Minimize2 } from 'lucide-react';
import ApiNode from './ApiNode';
import AiInterfaceNode from './AiInterfaceNode';
import { useDrop } from 'react-dnd';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getCategoryColor } from '../categoryData';

const nodeTypes = {
  apiNode: ApiNode,
  aiInterface: AiInterfaceNode,
};

const defaultEdgeOptions = {
  style: { 
    strokeDasharray: '5 5',
    stroke: '#666',
    strokeWidth: 1.5
  },
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#666',
  },
  animated: true,
};

const NodeWindow = ({ 
  nodes, 
  edges, 
  setNodes, 
  setEdges, 
  onApiDrop, 
  isExpanded, 
  setIsNodeWindowExpanded, 
  isDraggingApiCard,
  apis
}) => {
  const nodeWindowRef = useRef(null);
  const [activeNodes, setActiveNodes] = useState([]);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userIdea, setUserIdea] = useState('');
  const [error, setError] = useState(null);
  const [shouldGenerateIdea, setShouldGenerateIdea] = useState(false);

  // AI Interface logic
  const generateIdea = async (fromUserIdea = false) => {
    if (fromUserIdea && !userIdea) {
      return;
    }

    if (activeNodes.length === 0 && !fromUserIdea) {
      return;
    }

    setIsLoading(true);
    setError(null);

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
            addNode(api);
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
      setShouldGenerateIdea(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userIdea.trim()) {
      generateIdea(true);
      setUserIdea('');
    }
  };

  // Add AI Interface node on component mount
  useEffect(() => {
    const existingAiNode = nodes.find(node => node.id === 'ai-interface');
    if (!existingAiNode) {
      const aiNode = {
        id: 'ai-interface',
        type: 'aiInterface',
        position: { x: 50, y: 50 },
        data: {
          response,
          isLoading,
          error,
          userIdea,
          setUserIdea,
          handleSubmit,
          activeNodes,
        },
      };
      setNodes(nds => [...nds, aiNode]);
    }
  }, []);

  // Update AI Interface node data when state changes
  useEffect(() => {
    setNodes(nds => 
      nds.map(node => 
        node.id === 'ai-interface'
          ? {
              ...node,
              data: {
                ...node.data,
                response,
                isLoading,
                error,
                userIdea,
                setUserIdea,
                handleSubmit,
                activeNodes,
              },
            }
          : node
      )
    );
  }, [response, isLoading, error, userIdea, activeNodes]);

  // Track API nodes changes
  useEffect(() => {
    const apiNodes = nodes.filter(node => node.type === 'apiNode');
    const newActiveNodes = apiNodes.map(node => ({
      name: node.data.api.Name,
      description: node.data.api.Description,
      category: node.data.api.Category,
      url: node.data.api.URL
    }));

    // Only update activeNodes if the API nodes have actually changed
    if (JSON.stringify(newActiveNodes) !== JSON.stringify(activeNodes)) {
      setActiveNodes(newActiveNodes);
      if (newActiveNodes.length > 0) {
        setShouldGenerateIdea(true);
      }
    }
  }, [nodes]);

  // Generate ideas when API nodes change
  useEffect(() => {
    if (shouldGenerateIdea && !isLoading) {
      generateIdea(false);
    }
  }, [shouldGenerateIdea]);

  useEffect(() => {
    if (nodes.length > 1 && !isExpanded) {
      setIsNodeWindowExpanded(true);
    }
  }, [nodes.length, isExpanded, setIsNodeWindowExpanded]);

  const [, drop] = useDrop({
    accept: 'API_CARD',
    drop: (item, monitor) => {
      const api = item.api;
      
      const windowRect = nodeWindowRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      
      const position = {
        x: clientOffset.x - windowRect.left,
        y: clientOffset.y - windowRect.top
      };

      const flowInstance = nodeWindowRef.current.querySelector('.react-flow').getBoundingClientRect();
      const zoom = flowInstance ? flowInstance.width / windowRect.width : 1;

      const adjustedPosition = {
        x: position.x / zoom,
        y: position.y / zoom
      };

      const newNodeId = uuidv4();
      const newNode = {
        id: newNodeId,
        type: 'apiNode',
        position: adjustedPosition,
        data: { 
          api,
          getCategoryColor,
          onRemove: () => removeNode(newNodeId)
        },
      };

      setNodes(nds => [...nds, newNode]);
      
      const lastApiNode = [...nodes].reverse().find(node => node.type === 'apiNode');
      if (lastApiNode) {
        const newEdge = {
          id: `e${lastApiNode.id}-${newNodeId}`,
          source: lastApiNode.id,
          target: newNodeId,
          ...defaultEdgeOptions,
        };
        setEdges(eds => [...eds, newEdge]);
      }

      setIsNodeWindowExpanded(true);
    }
  });

  useEffect(() => {
    drop(nodeWindowRef);
  }, [drop]);

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onEdgesChange = (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  const onConnect = (params) => {
    const newEdge = {
      ...params,
      ...defaultEdgeOptions,
    };
    setEdges((eds) => addEdge(newEdge, eds));
  };

  const removeNode = (nodeId) => {
    if (nodeId === 'ai-interface') return; // Prevent removing AI Interface node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  };

  const addNode = (api) => {
    const newNodeId = uuidv4();
    const position = {
      x: Math.random() * 300,
      y: Math.random() * 300
    };

    const newNode = {
      id: newNodeId,
      type: 'apiNode',
      position,
      data: { 
        api,
        getCategoryColor,
        onRemove: () => removeNode(newNodeId)
      },
    };

    setNodes((nds) => [...nds, newNode]);
    
    const lastApiNode = [...nodes].reverse().find(node => node.type === 'apiNode');
    if (lastApiNode) {
      const newEdge = {
        id: `e${lastApiNode.id}-${newNodeId}`,
        source: lastApiNode.id,
        target: newNodeId,
        ...defaultEdgeOptions,
      };
      setEdges(eds => [...eds, newEdge]);
    }

    setIsNodeWindowExpanded(true);
  };

  const decoratedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      getCategoryColor,
      onRemove: () => removeNode(node.id)
    }
  }));

  const showWindow = isDraggingApiCard || isExpanded || nodes.length > 0;

  return (
    <div 
      ref={nodeWindowRef} 
      className={`node-window ${showWindow ? 'show' : ''} ${isExpanded ? 'expanded' : ''}`}
      style={{ 
        overflow: isExpanded ? 'visible' : 'hidden',
        background: 'white',
      }}
    >
      {isExpanded && (
        <div 
          style={{
            position: 'absolute',
            top: '-12px',
            right: '12px',
            zIndex: 1000,
          }}
        >
          <button 
            onClick={() => setIsNodeWindowExpanded(false)}
            style={{
              background: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
            }}
          >
            <Minimize2 size={18} color="#666" />
          </button>
        </div>
      )}
      <div className="node-window-content" style={{ width: '100%', height: '100%', position: 'relative', background: 'white' }}>
        <ReactFlow
          nodes={decoratedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          defaultZoom={1}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          fitView
          style={{ background: 'transparent' }}
        >
          <Background 
            variant="dots"
            gap={12}
            size={1}
            color="#00000010"
          />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default NodeWindow;