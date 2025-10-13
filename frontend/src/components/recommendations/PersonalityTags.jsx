import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const PersonalityTags = ({ onTagsChange, initialSelectedTags = [] }) => {
  const [tags, setTags] = useState({
    personality: [],
    activity: [],
    vibe: [],
    location: []
  });
  const [selectedTags, setSelectedTags] = useState(initialSelectedTags);
  const [loading, setLoading] = useState(true);

  // Fetch tags from API
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/recommendations/tags');
      
      if (response.data.success) {
        setTags(response.data.grouped);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to load personality tags');
    } finally {
      setLoading(false);
    }
  };

  // Handle tag selection
  const toggleTag = (tagName) => {
    let updatedTags;
    
    if (selectedTags.includes(tagName)) {
      // Remove tag
      updatedTags = selectedTags.filter(tag => tag !== tagName);
    } else {
      // Add tag
      updatedTags = [...selectedTags, tagName];
    }
    
    setSelectedTags(updatedTags);
    
    // Notify parent component
    if (onTagsChange) {
      onTagsChange(updatedTags);
    }
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedTags([]);
    if (onTagsChange) {
      onTagsChange([]);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading personality tags...</p>
      </div>
    );
  }

  return (
    <div className="personality-tags-container">
      {/* Personality Tags */}
      {tags.personality && tags.personality.length > 0 && (
        <div className="tag-category">
          <h3 className="tag-category-title">
            <span className="category-icon">🎭</span>
            Travel Personality
          </h3>
          <div className="personality-tags">
            {tags.personality.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`personality-tag ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                title={tag.description}
              >
                <span className="tag-icon">{tag.icon}</span>
                <span>{tag.display_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Tags */}
      {tags.activity && tags.activity.length > 0 && (
        <div className="tag-category">
          <h3 className="tag-category-title">
            <span className="category-icon">🎯</span>
            Activities & Interests
          </h3>
          <div className="personality-tags">
            {tags.activity.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`personality-tag ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                title={tag.description}
              >
                <span className="tag-icon">{tag.icon}</span>
                <span>{tag.display_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vibe Tags */}
      {tags.vibe && tags.vibe.length > 0 && (
        <div className="tag-category">
          <h3 className="tag-category-title">
            <span className="category-icon">✨</span>
            Travel Vibe
          </h3>
          <div className="personality-tags">
            {tags.vibe.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`personality-tag ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                title={tag.description}
              >
                <span className="tag-icon">{tag.icon}</span>
                <span>{tag.display_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Location Tags */}
      {tags.location && tags.location.length > 0 && (
        <div className="tag-category">
          <h3 className="tag-category-title">
            <span className="category-icon">🌍</span>
            Location Type
          </h3>
          <div className="personality-tags">
            {tags.location.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`personality-tag ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                title={tag.description}
              >
                <span className="tag-icon">{tag.icon}</span>
                <span>{tag.display_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedTags.length > 0 && (
        <div className="tag-selection-summary">
          <div className="summary-content">
            <span className="summary-icon">🎯</span>
            <span className="summary-text">
              <strong>{selectedTags.length}</strong> tag{selectedTags.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <button onClick={clearAll} className="clear-all-btn">
            Clear All
          </button>
        </div>
      )}

      {/* Helpful Hint */}
      {selectedTags.length === 0 && (
        <div className="tag-hint">
          <span>💡</span>
          <p>Select tags that match your travel style to get personalized recommendations!</p>
        </div>
      )}
    </div>
  );
};

export default PersonalityTags;