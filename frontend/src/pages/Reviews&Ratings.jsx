import React, { useState, useEffect } from 'react';
import { 
  Star, Camera, ThumbsUp, Filter, Search, 
  ChevronDown, X, Check, AlertCircle, Image
} from 'lucide-react';

const ReviewsRatings = () => {
  const [reviews, setReviews] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filters, setFilters] = useState({
    rating: 'all',
    sortBy: 'recent',
    destination: 'all'
  });
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    review_text: '',
    images: []
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    fetchReviews();
    fetchUserBookings();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/reviews?${params}`);
      const data = await response.json();
      setReviews(data.reviews);
      setDestinations(data.destinations);
      setPackages(data.packages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const response = await fetch('/api/user/bookings-for-review', { credentials: 'include' });
      const data = await response.json();
      setUserBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (reviewForm.rating === 0 || !reviewForm.title || !reviewForm.review_text) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('booking_id', selectedBooking.id);
      formData.append('place_id', selectedBooking.place_id);
      formData.append('package_id', selectedBooking.package_id);
      formData.append('rating', reviewForm.rating);
      formData.append('title', reviewForm.title);
      formData.append('review_text', reviewForm.review_text);

      reviewForm.images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        setShowWriteReview(false);
        setReviewForm({ rating: 0, title: '', review_text: '', images: [] });
        fetchReviews();
        fetchUserBookings();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (reviewForm.images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setReviewForm({ ...reviewForm, images: [...reviewForm.images, ...files] });
  };

  const removeImage = (index) => {
    const newImages = reviewForm.images.filter((_, i) => i !== index);
    setReviewForm({ ...reviewForm, images: newImages });
  };

  const handleHelpful = async (reviewId) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        credentials: 'include'
      });
      fetchReviews();
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              (interactive ? hoveredRating || reviewForm.rating : rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            onClick={() => interactive && setReviewForm({ ...reviewForm, rating: star })}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Reviews & Ratings</h1>
          <p className="text-lg text-gray-600">Read what travelers say about their experiences</p>
        </div>

        {/* Write Review CTA */}
        {userBookings.length > 0 && (
          <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white p-6 rounded-xl mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Share Your Experience</h2>
                <p>You have {userBookings.length} completed trips to review</p>
              </div>
              <button
                onClick={() => setShowWriteReview(true)}
                className="mt-4 md:mt-0 bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Write a Review
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reviews..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars & Up</option>
              <option value="3">3 Stars & Up</option>
            </select>

            <select
              value={filters.destination}
              onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Destinations</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>{dest.name}</option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
            </select>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={review.user_image || `https://ui-avatars.com/api/?name=${review.user_name}&size=40`}
                          alt={review.user_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold">{review.user_name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {renderStars(review.rating)}
                        <span className="font-semibold">{review.title}</span>
                      </div>
                    </div>
                    {review.status === 'approved' && (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{review.review_text}</p>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {review.place_name}
                    </span>
                    {review.package_name && (
                      <span className="text-gray-600">
                        <Package className="w-4 h-4 inline mr-1" />
                        {review.package_name}
                      </span>
                    )}
                  </div>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  {/* Helpful Button */}
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      onClick={() => handleHelpful(review.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Helpful ({review.helpful_count})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found</p>
          </div>
        )}
      </div>

      {/* Write Review Modal */}
      {showWriteReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Write a Review</h2>
                <button
                  onClick={() => setShowWriteReview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Select Booking */}
              {!selectedBooking && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select a trip to review:</h3>
                  <div className="space-y-3">
                    {userBookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className="w-full p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors text-left"
                      >
                        <h4 className="font-semibold">{booking.packageName}</h4>
                        <p className="text-sm text-gray-600">
                          {booking.destination} • {new Date(booking.tour_date).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Form */}
              {selectedBooking && (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold">{selectedBooking.packageName}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedBooking.destination} • {new Date(selectedBooking.tour_date).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Rating*
                    </label>
                    {renderStars(reviewForm.rating, true)}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Title*
                    </label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      placeholder="Summarize your experience"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Review*
                    </label>
                    <textarea
                      value={reviewForm.review_text}
                      onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                      placeholder="Share your experience with other travelers..."
                      rows="5"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Photos (Optional)
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {reviewForm.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {reviewForm.images.length < 5 && (
                        <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500">
                          <Camera className="w-6 h-6 text-gray-400" />
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Maximum 5 images</p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleSubmitReview}
                      className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsRatings;