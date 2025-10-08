import React from 'react';
import { 
  BarChart3, 
  Home,
  UserCheck,
  Map,
  Plus,
  Route
} from 'lucide-react';


const Sidebar = ({ sidebarOpen, activePage, setActivePage }) => {
  const menuItems = [
    { name: 'Dashboard', icon: Home, key: 'dashboard' },
    { name: 'User Management', icon: UserCheck, key: 'user-management' },
    { name: 'Maps', icon: Map, key: 'maps' },
  ];

  const mapsSubItems = [
    { name: 'Create Route', icon: Plus, key: 'create-route' },
    { name: 'Route Lists', icon: Route, key: 'route-lists' },
  ];

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-xl border-r border-gray-100 transition-all duration-300 flex flex-col`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h1 className={`text-xl font-bold text-gray-800 ${sidebarOpen ? 'block' : 'hidden'}`}>Admin</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.key}>
              <button
                onClick={() => setActivePage(item.key)}
                className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                  activePage === item.key 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className={`ml-3 font-medium ${sidebarOpen ? 'block' : 'hidden'}`}>{item.name}</span>
              </button>
              
              {/* Maps Sub-menu */}
              {item.key === 'maps' && sidebarOpen && (
                <div className="ml-8 mt-2 space-y-1">
                  {mapsSubItems.map((subItem) => (
                    <button
                      key={subItem.key}
                      onClick={() => setActivePage(subItem.key)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        activePage === subItem.key 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <subItem.icon className="h-4 w-4" />
                      <span className="ml-3 text-sm font-medium">{subItem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
            UA
          </div>
          <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
            <p className="font-medium text-gray-800">User Admin</p>
            <p className="text-sm text-gray-500">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;