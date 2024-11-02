import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'react-flow-renderer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Database, Cpu, BookOpen, Blocks } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('apis');
  const [currentPage, setCurrentPage] = useState(1);
  const [apisPerPage] = useState(30);
  const [randomizedApis, setRandomizedApis] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isNodeWindowExpanded, setIsNodeWindowExpanded] = useState(false);
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
    const newNode = {
      id: uuidv4(),
      type: 'apiNode',
      position,
      data: { api, getCategoryColor },
    };

    setNodes((nds) => [...nds, newNode]);
    setIsNodeWindowExpanded(true);
    setIsDraggingApiCard(false);
  }, []);

  const onDragStart = useCallback(() => {
    setIsDraggingApiCard(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setIsDraggingApiCard(false);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <div className="header-container">
          <h1>API Explorer</h1>
          <div className="tab-container">
            <button
              onClick={() => setActiveTab('apis')}
              className={`tab ${activeTab === 'apis' ? 'active' : ''}`}
            >
              <Database size={20} />
              <span>APIs</span>
            </button>
            <button
              onClick={() => setActiveTab('aiModels')}
              className={`tab ${activeTab === 'aiModels' ? 'active' : ''}`}
            >
              <Cpu size={20} />
              <span>AI Models</span>
            </button>
            <button
              onClick={() => setActiveTab('libraries')}
              className={`tab ${activeTab === 'libraries' ? 'active' : ''}`}
            >
              <BookOpen size={20} />
              <span>Libraries</span>
            </button>
            <button
              onClick={() => setActiveTab('buildingBlocks')}
              className={`tab ${activeTab === 'buildingBlocks' ? 'active' : ''}`}
            >
              <Blocks size={20} />
              <span>Building Blocks</span>
            </button>
          </div>
        </div>
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
              isExpanded={isNodeWindowExpanded}
              setIsNodeWindowExpanded={setIsNodeWindowExpanded}
              isDraggingApiCard={isDraggingApiCard}
              apis={randomizedApis}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;










