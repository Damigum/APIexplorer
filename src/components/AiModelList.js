import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CategoryFilter from './CategoryFilter';
import Pagination from './Pagination';
import { useDrag } from 'react-dnd';

const categoryMapping = {
  'text-generation': 'Text Generation',
  'text-to-text': 'Text2Text Generation',
  'text-classification': 'Text Classification',
  'token-classification': 'Token Classification',
  'question-answering': 'Question Answering',
  'table-question-answering': 'Table Question Answering',
  'zero-shot-classification': 'Zero-Shot Classification',
  'translation': 'Translation',
  'summarization': 'Summarization',
  'feature-extraction': 'Feature Extraction',
  'fill-mask': 'Fill-Mask',
  'sentence-similarity': 'Sentence Similarity',
  'text-to-image': 'Text-to-Image',
  'image-to-text': 'Image-to-Text',
  'image-classification': 'Image Classification',
  'object-detection': 'Object Detection',
  'image-segmentation': 'Image Segmentation',
  'depth-estimation': 'Depth Estimation',
  'image-to-image': 'Image-to-Image',
  'unconditional-image-generation': 'Unconditional Image Generation',
  'video-classification': 'Video Classification',
  'text-to-video': 'Text-to-Video',
  'zero-shot-image-classification': 'Zero-Shot Image Classification',
  'image-to-3d': 'Image-to-3D',
  'text-to-3d': 'Text-to-3D',
  'visual-question-answering': 'Visual Question Answering',
  'document-question-answering': 'Document Question Answering',
  'image-to-video': 'Image-to-Video',
  'text-to-speech': 'Text-to-Speech',
  'automatic-speech-recognition': 'Automatic Speech Recognition',
  'audio-to-audio': 'Audio-to-Audio',
  'audio-classification': 'Audio Classification',
  'voice-activity-detection': 'Voice Activity Detection',
  'zero-shot-object-detection': 'Zero-Shot Object Detection'
};

const AiModelList = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKeyValid, setApiKeyValid] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [modelsPerPage] = useState(30);

  useEffect(() => {
    const validateApiKey = async () => {
      if (!process.env.REACT_APP_HUGGING_FACE_TOKEN) {
        console.error('Hugging Face API key is not set');
        setApiKeyValid(false);
        setError('Hugging Face API key is not configured');
        setLoading(false);
        return false;
      }

      try {
        const response = await axios.get('https://huggingface.co/api/whoami-v2', {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_TOKEN}`,
          },
        });

        console.log('API Key validation successful:', response.data);
        setApiKeyValid(true);
        return true;
      } catch (err) {
        console.error('API Key validation failed:', err.response?.data || err.message);
        setApiKeyValid(false);
        setError('Invalid Hugging Face API key');
        setLoading(false);
        return false;
      }
    };

    const fetchModels = async () => {
      try {
        const isValid = await validateApiKey();
        if (!isValid) return;

        const response = await axios.get('https://huggingface.co/api/models', {
          params: {
            limit: 1100,
          },
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_TOKEN}`,
          },
        });

        const formattedModels = response.data.map((model) => {
          const avatarUrl = model.image && model.image.startsWith('http')
            ? model.image
            : 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg';

          const description = model.cardData?.description || 
                             model.description || 
                             model.tagline || 
                             'No description available';

          const category = model.pipeline_tag 
            ? categoryMapping[model.pipeline_tag.toLowerCase()] || model.pipeline_tag
            : 'Language Model';

          return {
            Name: model.id,
            Description: description,
            URL: `https://huggingface.co/${model.id}`,
            Category: category,
            Downloads: model.downloads,
            Likes: model.likes,
            Tags: model.tags || [],
            LastModified: model.lastModified,
            Author: model.author || model.id.split('/')[0],
            License: model.license || 'Unknown',
            ModelSize: model.modelSize,
            Private: model.private,
            SecurityStatus: model.securityStatus,
            AvatarUrl: avatarUrl,
          };
        });

        setModels(formattedModels);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching models:', err.response?.data || err.message);
        setError('Failed to load AI models');
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      return [category];
    });
    setCurrentPage(1); // Reset to first page when changing categories
  };

  // Update filtering logic to be more strict
  const filteredModels = models.filter(model => {
    if (selectedCategories.length === 0) return true;
    
    // Check if the model's category exactly matches any of the selected categories
    return selectedCategories.some(category => 
      model.Category === category
    );
  });

  // Get current models for pagination
  const indexOfLastModel = currentPage * modelsPerPage;
  const indexOfFirstModel = indexOfLastModel - modelsPerPage;
  const currentModels = filteredModels.slice(indexOfFirstModel, indexOfLastModel);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const ModelCard = ({ model }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'API_CARD',
      item: () => ({
        api: {
          Name: model.Name,
          Description: model.Description,
          URL: model.URL,
          Category: model.Category || 'AI Model',
          isAiModel: true
        }
      }),
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });

    const handleClick = (e) => {
      // Only navigate if we're not dragging
      if (!isDragging) {
        window.open(model.URL, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <div
        ref={drag}
        onClick={handleClick}
        style={{ 
          opacity: isDragging ? 0.5 : 1,
          cursor: 'pointer'
        }}
        className="model-card-link"
      >
        <div className="model-card">
          <div className="model-content">
            <div className="model-avatar"></div>
            <div className="model-info">
              <div className="model-name">{model.Name}</div>
              <div className="model-category">{model.Category}</div>
            </div>
            <div className="model-stats">
              <span>⬇️ {model.Downloads}</span>
              <span>❤️ {model.Likes}</span>
            </div>               
          </div>
        </div>
      </div>
    );
  };

  if (loading && currentPage === 1) return <div>Loading AI models...</div>;
  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        <h3>Error</h3>
        <p>{error}</p>
        {!apiKeyValid && (
          <p>
            Please check your Hugging Face API key in the environment variables.
            Current status: {process.env.REACT_APP_HUGGING_FACE_TOKEN ? 'Invalid key' : 'Missing key'}
          </p>
        )}
      </div>
    );
  }

  // Add console logs to debug
  console.log('Selected Categories:', selectedCategories);
  console.log('Total Models:', models.length);
  console.log('Filtered Models:', filteredModels.length);
  console.log('Sample Model Categories:', models.slice(0, 5).map(m => m.Category));

  return (
    <div className="ai-models-page">
      <CategoryFilter
        selectedCategories={selectedCategories}
        onCategoryChange={handleCategoryChange}
      />
      <div className="ai-models-container">
        <div className="model-list">
          {currentModels.map((model) => (
            <ModelCard key={model.Name} model={model} />
          ))}
        </div>
        <Pagination
          apisPerPage={modelsPerPage}
          totalApis={filteredModels.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
};

export default AiModelList;
