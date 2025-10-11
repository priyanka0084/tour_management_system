import React, { useState } from 'react';
import { 
  Heart, MapPin, Calendar, DollarSign, 
  Trash2, ShoppingCart, Eye, Star 
} from 'lucide-react';

const WishlistCard = ({ item, onRemove, onBookNow }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (window.confirm(`Remove ${item.place_name} from wishlist?`)) {
      setIsRemoving(true);
      await onRemove(item.wishlist_id); // ✅ FIXED: Use wishlist_id, not package_id
      setIsRemoving(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently added';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className={`group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 ${
      isRemoving ? 'opacity-50 scale-95' : ''
    }`}>
      {/* Image Container - FIXED HEIGHT TO MATCH CART */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={item.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'}
          alt={item.place_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-4 right-4 p-2.5 bg-white/90 hover:bg-red-500 text-red-500 hover:text-white rounded-full backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl group/btn"
        >
          <Heart 
            className="w-5 h-5 fill-current" 
          />
        </button>

        {/* Location Badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-semibold text-gray-800">{item.country_name}</span>
        </div>

        {/* Rating Badge - TOP LEFT */}
        {item.rating && (
          <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-800">{item.rating}/5</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-teal-600 transition-colors">
          {item.place_name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
          {item.place_description || 'Discover this amazing destination with unforgettable experiences.'}
        </p>

        {/* Details Grid - FIXED ALIGNMENT */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex flex-col">
              <p className="text-xs text-gray-500 font-medium">Duration</p>
              <p className="text-sm font-bold text-gray-800">{item.duration_days} Days</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex flex-col">
              <p className="text-xs text-gray-500 font-medium">Price</p>
              <p className="text-sm font-bold text-gray-800">₹{item.price_per_person?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Added Date */}
        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Added on {formatDate(item.added_at)}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onBookNow(item)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <ShoppingCart className="w-4 h-4" />
            Book Now
          </button>
          
          <button
            onClick={() => onBookNow(item)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 font-medium"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Shimmer Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
    </div>
  );
};

// Import Clock icon at top
import { Clock } from 'lucide-react';

export default WishlistCard;