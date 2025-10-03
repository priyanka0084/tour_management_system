import React from 'react';
import { Link } from 'react-router-dom';
// Import icons from the react-icons library
import { FaPlaneDeparture, FaMapMarkedAlt, FaBoxOpen, FaUserCircle, FaArrowLeft } from 'react-icons/fa';

// Reusable Dashboard Card Component
const DashboardCard = ({ to, icon, title, description, colorClass }) => {
  return (
    <Link to={to} className="group block">
      <div className="bg-white rounded-xl shadow-md p-6 transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
        {/* Top border accent that appears on hover */}
        <div className={`absolute top-0 left-0 w-full h-1 rounded-t-xl bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-4">{icon}</div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );
};

const UserDashboard = ({ user }) => {
  // A placeholder user object for demonstration if no user is passed
  const demoUser = {
    fullName: 'Alex Doe',
    email: 'alex.doe@example.com',
    role: 'Traveler',
    avatar: '' // You can add a URL to an image here
  };

  const currentUser = user || demoUser;

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* -- User Welcome Section -- */}
        {currentUser && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-10 flex flex-col md:flex-row items-center">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="User Avatar" className="w-20 h-20 rounded-full mr-0 md:mr-6 mb-4 md:mb-0 border-4 border-sky-200" />
            ) : (
              <FaUserCircle className="w-20 h-20 text-slate-300 mr-0 md:mr-6 mb-4 md:mb-0" />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome back, {currentUser.fullName}!</h1>
              <p className="text-gray-500 mt-2">Let's plan your next adventure.</p>
            </div>
          </div>
        )}

        {/* -- Dashboard Links Grid -- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DashboardCard
            to="/bookings"
            icon={<FaPlaneDeparture className="text-sky-500" />}
            title="My Bookings"
            description="View and manage your travel bookings."
            colorClass="from-sky-500 to-blue-500"
          />
          <DashboardCard
            to="/destinations"
            icon={<FaMapMarkedAlt className="text-emerald-500" />}
            title="Explore Destinations"
            description="Discover new places and amazing sights to visit."
            colorClass="from-emerald-500 to-green-500"
          />
          <DashboardCard
            to="/packages"
            icon={<FaBoxOpen className="text-violet-500" />}
            title="Travel Packages"
            description="Find the perfect, all-inclusive travel package."
            colorClass="from-violet-500 to-purple-500"
          />
        </div>

        {/* -- Back to Home Button -- */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center bg-gradient-to-r from-slate-600 to-slate-800 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:from-slate-700 hover:to-slate-900 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <FaArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;