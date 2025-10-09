import React from 'react';
import { 
  Calendar, MapPin, Users, Clock, CreditCard, 
  CheckCircle, XCircle, AlertCircle, Download, Eye 
} from 'lucide-react';

const BookingCard = ({ booking, onViewDetails, onDownloadReceipt }) => {
  // Status badge configuration
  const getStatusConfig = (status) => {
    const configs = {
      'pending': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        label: 'Pending'
      },
      'confirmed': {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle,
        label: 'Confirmed'
      },
      'completed': {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        label: 'Completed'
      },
      'cancelled': {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        label: 'Cancelled'
      }
    };
    return configs[status] || configs['pending'];
  };

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;

  // Format date
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate days until trip
  const daysUntilTrip = () => {
    const tripDate = new Date(booking.tour_date);
    const today = new Date();
    const diffTime = tripDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const days = daysUntilTrip();

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header with Image */}
      <div className="relative h-48 bg-gradient-to-br from-teal-400 to-blue-600 overflow-hidden">
        {booking.place_image ? (
          <img 
            src={booking.place_image} 
            alt={booking.tour_destination}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-16 h-16 text-white/50" />
          </div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusConfig.color} backdrop-blur-sm`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-xs font-semibold">{statusConfig.label}</span>
          </div>
        </div>

        {/* Destination Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white drop-shadow-lg">
            {booking.tour_destination}
          </h3>
          {booking.packageName && (
            <p className="text-white/90 text-sm mt-1">{booking.packageName}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Trip Countdown */}
        {booking.status === 'confirmed' && days > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Trip starts in</span>
              <span className="text-2xl font-bold text-teal-600">{days} days</span>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Tour Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(booking.tour_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Travelers</p>
              <p className="text-sm font-semibold text-gray-800">
                {booking.adults} Adults
                {booking.children > 0 && `, ${booking.children} Kids`}
              </p>
            </div>
          </div>

          {booking.departure && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Departure</p>
                <p className="text-sm font-semibold text-gray-800">
                  {booking.departure}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Amount</p>
              <p className="text-sm font-semibold text-gray-800">
                ₹{booking.amount?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Booking ID */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            Booking ID: <span className="font-mono font-semibold text-gray-700">#{booking.id}</span>
          </p>
          {booking.transaction_id && (
            <p className="text-xs text-gray-500 mt-1">
              Transaction: <span className="font-mono text-gray-700">{booking.transaction_id}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onViewDetails(booking)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          
          {booking.payment_status === 'success' && (
            <button
              onClick={() => onDownloadReceipt(booking)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-300 font-medium"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard;