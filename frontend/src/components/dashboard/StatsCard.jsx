import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  trend, 
  trendValue,
  description 
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${gradient}`}>
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 opacity-10">
        <div className="w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
      </div>
      <div className="absolute bottom-0 left-0 opacity-10">
        <div className="w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <Icon className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              trend === 'up' 
                ? 'bg-green-500/20 text-white' 
                : 'bg-red-500/20 text-white'
            }`}>
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-semibold">{trendValue}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-white/80 text-sm font-medium uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-4xl font-bold text-white">
            {value}
          </h3>
          {description && (
            <p className="text-white/70 text-xs mt-2">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  );
};

export default StatsCard;