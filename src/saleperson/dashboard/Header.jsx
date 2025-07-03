import React, { useState } from "react";

const Header = ({ activeTab }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const getTitle = () => {
    switch(activeTab) {
      case 'schedule': return 'My Schedule';
      case 'meetings': return 'Meetings';
      case 'leads': return 'Leads';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700 sticky top-0 z-30">
      <h2 className="text-xl font-semibold">{getTitle()}</h2>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full hover:bg-gray-700 relative"
          >
            <span>🔔</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
              <div className="px-4 py-2 text-sm border-b border-gray-700">No new notifications</div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              U
            </div>
          </button>
          
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
              <div className="px-4 py-2 text-sm border-b border-gray-700">user@example.com</div>
              <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;