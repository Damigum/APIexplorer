// NodeWindow.js
import React, { useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'react-flow-renderer';
import { Minimize2 } from 'lucide-react';
import ApiNode from './ApiNode';
import { useDrop } from 'react-dnd';
import AiInterface from './AiInterface';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes = {
  apiNode: ApiNode,
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
  const [activeNodes, setActiveNodes] = React.useState([]);

  useEffect(() => {
    const nodeData = nodes.map(node => ({
      name: node.data.api.Name,
      description: node.data.api.Description,
      category: node.data.api.Category,
      url: node.data.api.URL
    }));
    setActiveNodes(nodeData);
  }, [nodes]);

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

      onApiDrop(api, adjustedPosition);
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
    setEdges((eds) => addEdge(params, eds));
  };

  const removeNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  };

  const addNode = (api) => {
    const position = {
      x: Math.random() * 300,
      y: Math.random() * 300
    };

    const newNode = {
      id: uuidv4(),
      type: 'apiNode',
      position,
      data: { 
        api,
        onRemove: () => removeNode(newNode.id)
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const decoratedNodes = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onRemove: () => removeNode(node.id)
    }
  }));

  const showWindow = isDraggingApiCard || isExpanded || nodes.length > 0;

  return (
    <>
      <div 
        ref={nodeWindowRef} 
        className={`node-window ${showWindow ? 'show' : ''} ${isExpanded ? 'expanded' : ''}`}
        style={{ overflow: isExpanded ? 'visible' : 'hidden' }}
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
        <div className="node-window-content" style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ReactFlow
            nodes={decoratedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            defaultZoom={1}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            fitView={false}
          >
            <Background />
            <Controls />
          </ReactFlow>
          {isExpanded && (
            <div className="ai-interface-wrapper">
              <AiInterface 
                activeNodes={activeNodes} 
                onAddNode={addNode}
                apis={apis}
                setIsNodeWindowExpanded={setIsNodeWindowExpanded}
              />
            </div>
          )}
        </div>
      </div>
      <AiInterface 
        activeNodes={activeNodes} 
        onAddNode={addNode}
        apis={apis}
        setIsNodeWindowExpanded={setIsNodeWindowExpanded}
        isCollapsed={!isExpanded}
      />
    </>
  );
};

export default NodeWindow;



