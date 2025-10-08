import React, { useState } from 'react';
import { 
    Home,
    UserCheck,
    Map,
    Route,
    Menu,
    Bell,
    Search,
    Settings,
    Download,
    Calendar,
    ChevronDown,
    Plus,
    User,
    LogOut,
    Mail
} from 'lucide-react';

const Header = ({ sidebarOpen, setSidebarOpen, activePage }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: Home, key: 'dashboard' },
    { name: 'User Management', icon: UserCheck, key: 'user-management' },
    { name: 'Maps', icon: Map, key: 'maps' },
  ];

  const mapsSubItems = [
    { name: 'Create Route', icon: Plus, key: 'create-route' },
    { name: 'Route Lists', icon: Route, key: 'route-lists' },
  ];

  // Function to get current page title
  const getCurrentPageTitle = () => {
    const mainItem = menuItems.find(item => item.key === activePage);
    if (mainItem) return mainItem.name;
    
    const subItem = mapsSubItems.find(item => item.key === activePage);
    if (subItem) return subItem.name;
    
    return 'Dashboard';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          
          {/* Page Title */}
          <h1 className="text-xl font-semibold text-gray-900">
            {getCurrentPageTitle()}
          </h1>
        </div>

        {/* Right side icons */}
        <div className="flex items-center space-x-4">
          {/* Notification Icon with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Notification items */}
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New message received</p>
                        <p className="text-xs text-gray-500 mt-1">You have a new message from John Doe</p>
                        <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Order completed</p>
                        <p className="text-xs text-gray-500 mt-1">Your order #12345 has been completed</p>
                        <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Icon with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                UA
              </div>
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      UA
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">User Admin</p>
                      <p className="text-sm text-gray-500">admin@example.com</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Profile Settings</span>
                  </button>
                  
               
                </div>
                
                <div className="p-2 border-t border-gray-100">
                  <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-red-600 transition-colors">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;