import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ApiList from './components/ApiList';
import Pagination from './components/Pagination';
import NodeWindow from './components/NodeWindow';
import apiData from './apiData.json';
import { getCategoryColor } from './categoryData';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [apisPerPage] = useState(30);
  const [randomizedApis, setRandomizedApis] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showNodeWindow, setShowNodeWindow] = useState(false);
  const [isNodeWindowExpanded, setIsNodeWindowExpanded] = useState(false);
  const [isHoveringNodeWindow, setIsHoveringNodeWindow] = useState(false);
  const [isDraggingApiCard, setIsDraggingApiCard] = useState(false);

  useEffect(() => {
    const flattenedApis = Object.values(apiData).flat();
    setRandomizedApis(shuffleArray(flattenedApis));
  }, []);

  const indexOfLastApi = currentPage * apisPerPage;
  const indexOfFirstApi = indexOfLastApi - apisPerPage;
  const currentApis = randomizedApis.slice(indexOfFirstApi, indexOfLastApi);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const onApiDrop = useCallback((api, position) => {
    console.log('API dropped:', api, 'at position:', position);

    const newNode = {
      id: uuidv4(),
      type: 'apiNode',
      position,
      data: { api, getCategoryColor },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsNodeWindowExpanded(true);
    setShowNodeWindow(true);
    setIsDraggingApiCard(false);
  }, []);

  const onDragStart = useCallback(() => {
    setIsDraggingApiCard(true);
    setShowNodeWindow(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setIsDraggingApiCard(false);
  }, []);

  const onDragOver = useCallback(() => {
    setShowNodeWindow(true);
  }, []);

  const onDragLeave = useCallback(() => {
    if (!isNodeWindowExpanded && !isHoveringNodeWindow && !isDraggingApiCard) {
      setShowNodeWindow(false);
    }
  }, [isNodeWindowExpanded, isHoveringNodeWindow, isDraggingApiCard]);

  const onNodeWindowMouseEnter = useCallback(() => {
    setIsHoveringNodeWindow(true);
    setShowNodeWindow(true);
  }, []);

  const onNodeWindowMouseLeave = useCallback(() => {
    setIsHoveringNodeWindow(false);
    if (!isNodeWindowExpanded && !isDraggingApiCard) {
      const timer = setTimeout(() => {
        setShowNodeWindow(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isNodeWindowExpanded, isDraggingApiCard]);

  useEffect(() => {
    if (!isHoveringNodeWindow && !isNodeWindowExpanded && !isDraggingApiCard) {
      const timer = setTimeout(() => {
        setShowNodeWindow(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isHoveringNodeWindow, isNodeWindowExpanded, isDraggingApiCard]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <h1>API Explorer</h1>
        <div className={`main-container ${isNodeWindowExpanded ? 'expanded' : ''}`}>
          <div className="api-list-container">
            <ApiList 
              apis={currentApis} 
              getCategoryColor={getCategoryColor}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
            <Pagination
              apisPerPage={apisPerPage}
              totalApis={randomizedApis.length}
              paginate={paginate}
              currentPage={currentPage}
            />
          </div>
          <ReactFlowProvider>
            <NodeWindow 
              nodes={nodes} 
              edges={edges} 
              setNodes={setNodes} 
              setEdges={setEdges} 
              onApiDrop={onApiDrop}
              show={showNodeWindow}
              isExpanded={isNodeWindowExpanded}
              setIsNodeWindowExpanded={setIsNodeWindowExpanded}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onMouseEnter={onNodeWindowMouseEnter}
              onMouseLeave={onNodeWindowMouseLeave}
              isDraggingApiCard={isDraggingApiCard}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;






