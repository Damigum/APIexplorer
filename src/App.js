import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Database, Cpu, BookOpen, Blocks, Filter, Bookmark, BookmarkX } from 'lucide-react';
import ApiList from './components/ApiList';
import Pagination from './components/Pagination';
import EnhancedAiInterface from './components/EnhancedAiInterface';
import AiModelList from './components/AiModelList';
import apiData from './apiData.json';
import { getCategoryColor, groupedCategories } from './categoryData';
import './App.css';
import './styles/categoryColors.css';
import axios from 'axios';
import ApiFilter from './components/ApiFilter';
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

const logUniqueCategories = (apis) => {
  const categories = new Set();
  const categoryCounts = {};
  
  Object.values(apis).flat().forEach(api => {
    if (api.Category) {
      categories.add(api.Category);
      categoryCounts[api.Category] = (categoryCounts[api.Category] || 0) + 1;
    }
  });
  
  // Check for mismatches with categoryData.js
  const definedCategories = new Set(
    Object.values(groupedCategories)
      .flatMap(group => group.subcategories)
  );
  
  const undefinedCategories = [...categories].filter(cat => !definedCategories.has(cat));
  const unusedCategories = [...definedCategories].filter(cat => !categories.has(cat));
  
  return { categories, categoryCounts, undefinedCategories, unusedCategories };
};

// Add this function at the top level, before the App component
const getDailySeed = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
};

// Add this function to create a seeded random number generator
const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

function App() {
  const [activeTab, setActiveTab] = useState('apis');
  const [currentPage, setCurrentPage] = useState(1);
  const [apisPerPage] = useState(60);
  const [randomizedApis, setRandomizedApis] = useState([]);
  const [allApis, setAllApis] = useState([]);
  const [activeNodes, setActiveNodes] = useState([]);
  const [isInterfaceExpanded, setIsInterfaceExpanded] = useState(false);
  const [isDraggingApiCard, setIsDraggingApiCard] = useState(false);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [aiModels, setAiModels] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [bookmarkedApis, setBookmarkedApis] = useState([]);

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedApis');
    if (savedBookmarks) {
      setBookmarkedApis(JSON.parse(savedBookmarks));
    }
  }, []);

  // Add this new effect to handle tab changes
  useEffect(() => {
    // Reset filters and current page when switching tabs
    setFilters({ search: '', category: '' });
    setCurrentPage(1);
  }, [activeTab]);

  const toggleBookmark = (api) => {
    setBookmarkedApis(prev => {
      const isBookmarked = prev.some(bookmark => bookmark.Name === api.Name);
      let newBookmarks;
      
      if (isBookmarked) {
        newBookmarks = prev.filter(bookmark => bookmark.Name !== api.Name);
      } else {
        newBookmarks = [...prev, api];
      }
      
      localStorage.setItem('bookmarkedApis', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  const isApiBookmarked = (apiName) => {
    return bookmarkedApis.some(bookmark => bookmark.Name === apiName);
  };

  const filterApis = (apis) => {
    const searchTerm = filters.search.toLowerCase();
    
    if (!searchTerm && !filters.category) {
      return apis;
    }

    const getRelevanceScore = (api) => {
      let score = 0;
      
      // Exact name match gets highest priority
      if (api.Name.toLowerCase() === searchTerm) {
        score += 100;
      }
      // Name starts with search term gets high priority
      else if (api.Name.toLowerCase().startsWith(searchTerm)) {
        score += 75;
      }
      // Name contains search term gets medium priority
      else if (api.Name.toLowerCase().includes(searchTerm)) {
        score += 50;
      }
      
      // Category matches get good priority
      if (api.Category.toLowerCase().includes(searchTerm)) {
        score += 30;
      }
      
      // Description matches get lower priority
      if (api.Description.toLowerCase().includes(searchTerm)) {
        score += 10;
      }
      
      return score;
    };

    return apis
      .filter(api => {
        const matchesSearch = !filters.search || 
          api.Name.toLowerCase().includes(searchTerm) ||
          api.Description.toLowerCase().includes(searchTerm) ||
          api.Category.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !filters.category || 
          api.Category.toLowerCase() === filters.category.toLowerCase();
        
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));
  };

  useEffect(() => {
    const flattenedApis = Object.values(apiData).flat();
    
    // Get daily seed
    const seed = getDailySeed();
    
    // Create a copy of the array with indices
    const indexedApis = flattenedApis.map((api, index) => ({ api, index }));
    
    // Sort using seeded random numbers
    const shuffledApis = indexedApis
      .sort((a, b) => seededRandom(a.index + seed.length) - seededRandom(b.index + seed.length))
      .map(({ api }) => api);
    
    setAllApis(shuffledApis);
    
    const filteredApis = showFreeOnly 
      ? shuffledApis.filter(api => freeApis.includes(api.Name))
      : shuffledApis;
    
    const { categories, categoryCounts, undefinedCategories, unusedCategories } = logUniqueCategories(apiData);
    
    setRandomizedApis(filteredApis);
    setCurrentPage(1);

    // Check for updates every hour
    const interval = setInterval(() => {
      const newSeed = getDailySeed();
      if (newSeed !== seed) {
        // If it's a new day, trigger a re-render with the new seed
        setRandomizedApis([...filteredApis]); // Force re-render with new order
      }
    }, 3600000); // Check every hour

    return () => clearInterval(interval);
  }, [showFreeOnly]);

  // Add new effect for 2-minute randomization
  useEffect(() => {
    const randomizeInterval = setInterval(() => {
      setRandomizedApis(prevApis => {
        const shuffled = [...prevApis].sort(() => Math.random() - 0.5);
        return shuffled;
      });
    }, 120000); // 2 minutes in milliseconds

    return () => clearInterval(randomizeInterval);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('https://huggingface.co/api/models', {
          params: {
            limit: 1000,
          },
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_TOKEN}`,
          },
        });

        const formattedModels = response.data.map((model) => ({
          Name: model.id,
          Description: model.cardData?.description || 
                      model.description || 
                      model.tagline || 
                      'No description available',
          URL: `https://huggingface.co/${model.id}`,
          Category: model.pipeline_tag || 'Language Model',
          Downloads: model.downloads,
          Likes: model.likes,
          isAiModel: true
        }));
        
        setAiModels(formattedModels);
      } catch (error) {
        // Silently handle error
      }
    };
    
    fetchModels();
  }, []);

  const baseApis = activeTab === 'bookmarks' ? bookmarkedApis : randomizedApis;
  const filteredApis = filterApis(baseApis);
  const indexOfLastApi = currentPage * apisPerPage;
  const indexOfFirstApi = indexOfLastApi - apisPerPage;
  const currentApis = activeTab === 'bookmarks' 
    ? filteredApis 
    : filteredApis.slice(indexOfFirstApi, indexOfLastApi);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleAddNode = useCallback((api) => {
    const newNode = {
      name: api.Name,
      category: api.Category,
      description: api.Description,
      url: api.URL
    };

    setActiveNodes((prev) => {
      // Check if the API is already in the workspace
      const isDuplicate = prev.some(node => node.name === api.Name);
      if (isDuplicate) {
        return prev;
      }
      return [...prev, newNode];
    });
    setIsInterfaceExpanded(true);
  }, []);

  const handleRemoveNode = (apiToRemove) => {
    setActiveNodes(prevNodes => prevNodes.filter(node => node.name !== apiToRemove.name));
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
        <svg style={{ display: 'none' }}>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -18" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <filter id='pixelate' x='0' y='0'>
            <feflood height='2' width='2' x='5' y='5'></feflood>
            <fecomposite height='5' width='5'></fecomposite>
            <fetile result='a'></fetile>
            <fecomposite in2='a' in='SourceGraphic' operator='in'></fecomposite>
            <femorphology operator='dilate' radius='2'></femorphology>
          </filter>
        </svg>
        <div className="header-container">
          <div className="header-content">
            <div className="title-container">
              <h1>
                <div id="wrap">
                  {[...Array(11)].map((_, index) => (
                    <div key={index}>
                      <div></div>
                    </div>
                  ))}
                </div>
                <span 
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setCurrentPage(1);
                    setActiveTab('apis');
                  }}
                  style={{ cursor: 'pointer' }}
                  className="devshii-title"
                >
                  DEVSHII
                </span>
              </h1>
            </div>
          </div>
        </div>
        <div className="subtitle-container">
          <h2 className="subtitle">Explore and combine APIs with AI</h2>
        </div>
        <div className={`main-container ${isInterfaceExpanded ? 'expanded' : ''}`}>
          <div className="api-list-container">
            {(activeTab === 'apis' || activeTab === 'bookmarks') && (
              <>
                <ApiFilter 
                  onFilterChange={setFilters} 
                  filters={filters}
                  bookmarkedCount={bookmarkedApis.length}
                  onBookmarkClick={() => setActiveTab(activeTab === 'bookmarks' ? 'apis' : 'bookmarks')}
                  isBookmarkTab={activeTab === 'bookmarks'}
                />
                <ApiList 
                  apis={currentApis}
                  getCategoryColor={getCategoryColor}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onBookmark={toggleBookmark}
                  isBookmarked={isApiBookmarked}
                  onAddToWorkspace={handleAddNode}
                />
                {activeTab !== 'bookmarks' && (
                  <Pagination
                    apisPerPage={apisPerPage}
                    totalApis={filteredApis.length}
                    paginate={paginate}
                    currentPage={currentPage}
                  />
                )}
              </>
            )}
            {activeTab === 'aiModels' && <AiModelList />}
          </div>
          <EnhancedAiInterface 
            activeNodes={activeNodes}
            onAddNode={handleAddNode}
            onRemoveNode={handleRemoveNode}
            apis={[...allApis, ...aiModels]}
            setIsInterfaceExpanded={setIsInterfaceExpanded}
            isCollapsed={false}
            isExpanded={isInterfaceExpanded}
            isDraggingApiCard={isDraggingApiCard}
            freeApis={freeApis}
          />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;