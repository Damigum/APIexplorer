import React, { useState, useEffect } from 'react';
import ApiList from './components/ApiList';
import Pagination from './components/Pagination';
import apiData from './apiData.json';
import { getCategoryColor } from './categoryData';
import './App.css';

// Function to shuffle an array
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
  const [apisPerPage] = useState(24);
  const [randomizedApis, setRandomizedApis] = useState([]);

  useEffect(() => {
    // Flatten and randomize the API data
    const flattenedApis = Object.values(apiData).flat();
    setRandomizedApis(shuffleArray(flattenedApis));
  }, []);

  // Get current APIs
  const indexOfLastApi = currentPage * apisPerPage;
  const indexOfFirstApi = indexOfLastApi - apisPerPage;
  const currentApis = randomizedApis.slice(indexOfFirstApi, indexOfLastApi);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="App">
      <h1>API Explorer</h1>
      <ApiList apis={currentApis} getCategoryColor={getCategoryColor} />
      <Pagination
        apisPerPage={apisPerPage}
        totalApis={randomizedApis.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
}

export default App;

