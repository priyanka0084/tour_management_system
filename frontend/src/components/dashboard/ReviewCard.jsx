import React from 'react';
import { 
  Star, MapPin, Calendar, ThumbsUp, 
  CheckCircle, Clock, XCircle, Edit2 
} from 'lucide-react';

const ReviewCard = ({ review, onEdit }) => {
  // Status configuration
  const getStatusConfig = (status) => {
    const configs = {
      'pending': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        label: 'Under Review'
      },
      'approved': {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'Published'
      },
      'rejected': {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        label: 'Not Approved'
      }
    };
    return configs[status] || configs['pending'];
  };

  const statusConfig = getStatusConfig(review.status);
  const StatusIcon = statusConfig.icon;

  // Render stars
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header Section */}
      <div className="relative h-32 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 overflow-hidden">
        {review.place_image ? (
          <>
            <img 
              src={review.place_image} 
              alt={review.place_name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full"></div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusConfig.color} backdrop-blur-sm`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{statusConfig.label}</span>
          </div>
        </div>

        {/* Verified Badge */}
        {review.verified_purchase && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-full backdrop-blur-sm shadow-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Verified</span>
            </div>
          </div>
        )}

        {/* Place Name */}
        <div className="absolute bottom-3 left-3">
          <h3 className="text-lg font-bold text-white drop-shadow-lg">
            {review.place_name || review.tour_destination}
          </h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Rating & Date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {renderStars(review.rating)}
            <span className="ml-2 text-lg font-bold text-gray-800">
              {review.rating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <Calendar className="w-4 h-4" />
            {formatDate(review.created_at)}
          </div>
        </div>

        {/* Review Title */}
        <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
          {review.title}
        </h4>

        {/* Review Text */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
          {review.review_text}
        </p>

        {/* Package/Tour Info */}
        {review.package_name && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-gray-700 line-clamp-1">
              <span className="font-semibold">Package:</span> {review.package_name}
            </span>
          </div>
        )}

        {/* Tour Date */}
        {review.tour_date && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-semibold">Traveled on:</span> {formatDate(review.tour_date)}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Helpful Count */}
          <div className="flex items-center gap-2 text-gray-600">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                {review.helpful_count || 0} helpful
              </span>
            </div>
          </div>

          {/* Edit Button (if pending or need changes) */}
          {review.status === 'pending' && onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg hover:from-teal-600 hover:to-blue-600 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
    </div>
  );
};

export default ReviewCard;