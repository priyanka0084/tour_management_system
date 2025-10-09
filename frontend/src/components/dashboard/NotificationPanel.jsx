import React, { useState } from 'react';
import { 
  Bell, X, Check, CheckCheck, Trash2, 
  MessageSquare, CreditCard, Gift, AlertCircle, Info 
} from 'lucide-react';

const NotificationPanel = ({ 
  notifications, 
  unreadCount,
  isOpen, 
  onClose, 
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationClick
}) => {
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    const icons = {
      'booking_confirmation': { icon: CheckCheck, color: 'text-green-600 bg-green-100' },
      'payment_status': { icon: CreditCard, color: 'text-blue-600 bg-blue-100' },
      'promotional': { icon: Gift, color: 'text-purple-600 bg-purple-100' },
      'reminder': { icon: Bell, color: 'text-orange-600 bg-orange-100' },
      'system': { icon: Info, color: 'text-gray-600 bg-gray-100' }
    };
    return icons[type] || icons['system'];
  };

  // Format relative time
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-teal-100">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {['all', 'unread', 'read'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                  filter === filterOption
                    ? 'bg-white text-teal-600 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <div className="px-5 py-3 border-b border-gray-200">
            <button
              onClick={onMarkAllAsRead}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors font-medium text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="h-[calc(100%-12rem)] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Bell className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No notifications
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const iconConfig = getNotificationIcon(notification.type);
                const NotifIcon = iconConfig.icon;

                return (
                  <div
                    key={notification.id}
                    className={`relative p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => onNotificationClick(notification)}
                  >
                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-teal-500 rounded-full"></div>
                    )}

                    <div className="flex gap-3 ml-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-2.5 rounded-xl ${iconConfig.color}`}>
                        <NotifIcon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {getRelativeTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-teal-600 hover:bg-teal-50 rounded transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(notification.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;