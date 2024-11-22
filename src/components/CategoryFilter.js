import React from 'react';
import {
  // Multimodal icons
  MessageSquare,
  Eye,
  FileQuestion,
  Video,
  Combine,
  
  // Computer Vision icons
  Mountain,
  Image as ImageIcon,
  Box,
  Scissors,
  FileImage,
  FileVideo,
  PlaySquare,
  Zap,
  Crosshair,
  
  // NLP icons
  FileText,
  Tags,
  Table2,
  HelpCircle,
  Sparkles,
  Languages,
  FileStack,
  FileCode,
  FileInput,
  GitCompare,
  
  // Audio icons
  Mic,
  Music,
  Headphones,
  Volume2,
  VolumeX
} from 'lucide-react';

const categoryIcons = {
  // Multimodal
  'Image-Text-to-Text': MessageSquare,
  'Visual Question Answering': Eye,
  'Document Question Answering': FileQuestion,
  'Video-Text-to-Text': Video,
  'Any-to-Any': GitCompare,

  // Computer Vision
  'Depth Estimation': Mountain,
  'Image Classification': ImageIcon,
  'Object Detection': Box,
  'Image Segmentation': Scissors,
  'Text-to-Image': FileImage,
  'Image-to-Text': FileText,
  'Image-to-Image': ImageIcon,
  'Image-to-Video': FileVideo,
  'Unconditional Image Generation': ImageIcon,
  'Video Classification': PlaySquare,
  'Text-to-Video': Video,
  'Zero-Shot Image Classification': Zap,
  'Mask Generation': Box,
  'Zero-Shot Object Detection': Box,
  'Text-to-3D': Box,
  'Image-to-3D': Box,
  'Image Feature Extraction': ImageIcon,
  'Keypoint Detection': Crosshair,

  // Natural Language Processing
  'Text Classification': FileText,
  'Token Classification': Tags,
  'Table Question Answering': Table2,
  'Question Answering': HelpCircle,
  'Zero-Shot Classification': Sparkles,
  'Translation': Languages,
  'Summarization': FileStack,
  'Feature Extraction': FileCode,
  'Text Generation': FileText,
  'Text2Text Generation': FileText,
  'Fill-Mask': FileInput,
  'Sentence Similarity': GitCompare,

  // Audio
  'Text-to-Speech': Mic,
  'Text-to-Audio': Music,
  'Automatic Speech Recognition': Headphones,
  'Audio-to-Audio': Volume2,
  'Audio Classification': Music,
  'Voice Activity Detection': VolumeX
};

const categoryGroups = {
  'Multimodal': [
    'Image-Text-to-Text',
    'Visual Question Answering',
    'Document Question Answering',
    'Video-Text-to-Text',
    'Any-to-Any'
  ],
  'Computer Vision': [
    'Depth Estimation',
    'Image Classification',
    'Object Detection',
    'Image Segmentation',
    'Text-to-Image',
    'Image-to-Text',
    'Image-to-Image',
    'Image-to-Video',
    'Unconditional Image Generation',
    'Video Classification',
    'Text-to-Video',
    'Zero-Shot Image Classification',
    'Mask Generation',
    'Zero-Shot Object Detection',
    'Text-to-3D',
    'Image-to-3D',
    'Image Feature Extraction',
    'Keypoint Detection'
  ],
  'Natural Language Processing': [
    'Text Classification',
    'Token Classification',
    'Table Question Answering',
    'Question Answering',
    'Zero-Shot Classification',
    'Translation',
    'Summarization',
    'Feature Extraction',
    'Text Generation',
    'Text2Text Generation',
    'Fill-Mask',
    'Sentence Similarity'
  ],
  'Audio': [
    'Text-to-Speech',
    'Text-to-Audio',
    'Automatic Speech Recognition',
    'Audio-to-Audio',
    'Audio Classification',
    'Voice Activity Detection'
  ]
};

const CategoryFilter = ({ selectedCategories, onCategoryChange }) => {
  return (
    <div className="category-filter">
      {Object.entries(categoryGroups).map(([groupName, categories]) => (
        <div key={groupName} className="category-group">
          <h3>{groupName}</h3>
          <div className="category-items">
            {categories.map(category => {
              const IconComponent = categoryIcons[category];
              return (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`suggestion-tab ${selectedCategories.includes(category) ? 'active' : ''}`}
                >
                  {IconComponent && <IconComponent size={16} />}
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryFilter; 