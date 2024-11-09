import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Database, Cpu, BookOpen, Blocks, Filter } from 'lucide-react';
import ApiList from './components/ApiList';
import Pagination from './components/Pagination';
import EnhancedAiInterface from './components/EnhancedAiInterface';
import apiData from './apiData.json';
import { getCategoryColor } from './categoryData';
import './App.css';

const freeApis = [
  'HTTP Cat', 'HTTP Dogs', 'RandomDog', 'RandomFox', 'Shibe.Online',
  'Open Library', 'Bhagavad Gita', 'British National Bibliography',
  'Nager.Date', "Abstract's Holiday API",
  'JSONPlaceholder', 'ReqRes', 'Public APIs',
  'Deck of Cards', 'PokéAPI', 'Open Trivia',
  'Data.gov', 'Open Government, USA', 'Census.gov',
  'Numbers API', 'Newton',
  'Breaking Bad Quotes', 'Kanye.rest',
  'Open Notify', 'NASA',
  'Open-Meteo', '7Timer!'
];

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
  const [activeNodes, setActiveNodes] = useState([]);
  const [isInterfaceExpanded, setIsInterfaceExpanded] = useState(false);
  const [isDraggingApiCard, setIsDraggingApiCard] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  useEffect(() => {
    const flattenedApis = Object.values(apiData).flat();
    const filteredApis = showFreeOnly 
      ? flattenedApis.filter(api => freeApis.includes(api.Name))
      : flattenedApis;
    setRandomizedApis(shuffleArray(filteredApis));
    setCurrentPage(1);
  }, [showFreeOnly]);

  const indexOfLastApi = currentPage * apisPerPage;
  const indexOfFirstApi = indexOfLastApi - apisPerPage;
  const currentApis = randomizedApis.slice(indexOfFirstApi, indexOfLastApi);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleAddNode = useCallback((api) => {
    const newNode = {
      name: api.Name,
      category: api.Category,
      description: api.Description,
      url: api.URL
    };

    setActiveNodes((prev) => [...prev, newNode]);
    setIsInterfaceExpanded(true);
  }, []);

  const handleRemoveNode = (apiToRemove) => {
    setActiveNodes(prevNodes => prevNodes.filter(node => node.id !== apiToRemove.id));
  };

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
            <button
              onClick={() => setShowFreeOnly(!showFreeOnly)}
              className={`tab ${showFreeOnly ? 'active' : ''}`}
            >
              <Filter size={20} />
              <span>{showFreeOnly ? 'Free APIs' : 'All APIs'}</span>
            </button>
          </div>
        </div>
        <div className={`main-container ${isInterfaceExpanded ? 'expanded' : ''}`}>
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
          <EnhancedAiInterface 
            activeNodes={activeNodes}
            onAddNode={handleAddNode}
            onRemoveNode={handleRemoveNode}
            apis={randomizedApis}
            setIsInterfaceExpanded={setIsInterfaceExpanded}
            isCollapsed={false}
            isExpanded={isInterfaceExpanded}
            isDraggingApiCard={isDraggingApiCard}
            freeApis={freeApis}
          />
        </div>
        <div className="attribution">
          <a href="https://logo.dev" alt="Logo API">Logos provided by Logo.dev</a>
        </div>
      </div>
    </DndProvider>
  );
}

export default App;