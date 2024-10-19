import React, { useRef, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'react-flow-renderer';
import ApiNode from './ApiNode';
import { useDrop } from 'react-dnd';
import AiInterface from './AiInterface';

const nodeTypes = {
  apiNode: ApiNode,
};

const NodeWindow = ({ nodes, edges, setNodes, setEdges, onApiDrop, show, isExpanded, onDragOver, onDragLeave }) => {
  const nodeWindowRef = useRef(null);
  const [showAiInterface, setShowAiInterface] = useState(false);

  const [, drop] = useDrop({
    accept: 'API_CARD',
    drop: (item, monitor) => {
      const api = item.api;
      const clientOffset = monitor.getClientOffset();

      if (nodeWindowRef.current && clientOffset) {
        const boundingRect = nodeWindowRef.current.getBoundingClientRect();
        const x = clientOffset.x - boundingRect.left;
        const y = clientOffset.y - boundingRect.top;
        onApiDrop(api, { x, y });
      }
    },
    hover: (item, monitor) => {
      onDragOver();
    },
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

  return (
    <div 
      ref={nodeWindowRef} 
      className={`node-window ${show ? 'show' : ''} ${isExpanded ? 'expanded' : ''}`}
      onDragLeave={onDragLeave}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      {isExpanded && (
        <div className="ai-interface-wrapper">
          <div className="ai-interface-toggle">
            <button onClick={() => setShowAiInterface(!showAiInterface)}>
              {showAiInterface ? 'Hide AI Interface' : 'Show AI Interface'}
            </button>
          </div>
          {showAiInterface && <AiInterface />}
        </div>
      )}
    </div>
  );
};

export default NodeWindow;





