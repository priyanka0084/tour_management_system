// ========================================
// REVIEW IMAGES COMPONENT
// Display review images with lightbox functionality
// ========================================

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const ReviewImages = ({ images }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!lightboxOpen) return;
    
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  return (
    <>
      {/* Image Gallery */}
      <div className="review-images-gallery">
        {images.slice(0, 5).map((image, index) => (
          <div 
            key={index} 
            className="review-image-item"
            onClick={() => openLightbox(index)}
          >
            <img 
              src={image} 
              alt={`Review image ${index + 1}`}
              loading="lazy"
            />
            <div className="review-image-overlay">
              <ZoomIn size={24} />
            </div>
            
            {/* Show +N indicator on last image if more than 5 */}
            {index === 4 && images.length > 5 && (
              <div className="review-images-more">
                +{images.length - 5}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          {/* Close Button */}
          <button 
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X size={32} />
          </button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button 
                className="lightbox-nav lightbox-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft size={40} />
              </button>

              <button 
                className="lightbox-nav lightbox-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next image"
              >
                <ChevronRight size={40} />
              </button>
            </>
          )}

          {/* Main Image */}
          <div 
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={images[currentImageIndex]} 
              alt={`Review image ${currentImageIndex + 1}`}
              className="lightbox-image"
            />
            
            {/* Image Counter */}
            <div className="lightbox-counter">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="lightbox-thumbnails">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`lightbox-thumbnail ${
                    index === currentImageIndex ? 'active' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ReviewImages;