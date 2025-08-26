import React from "react";

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  mobileMenuOpen,
  setMobileMenuOpen
}) => {
  const navItems = [
    { id: 'schedule', icon: '📅', label: 'Schedule' },
    { id: 'meetings', icon: '🤝', label: 'Meetings' },
    { id: 'leads', icon: '📋', label: 'Leads' },
    { id: 'territory', icon: '📋', label: 'Territory' }
  ];

  const handleTabChange = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className={`
      ${sidebarOpen ? 'w-64' : 'w-20'} 
      ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0
      fixed md:relative z-40 h-full
      bg-gray-800 transition-all duration-300 flex flex-col
    `}>
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {sidebarOpen ? (
          <h1 className="text-xl font-bold">SalesPro</h1>
        ) : (
          <h1 className="text-xl font-bold">SP</h1>
        )}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-lg hover:bg-gray-700 hidden md:block"
        >
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleTabChange(item.id)}
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeTab === item.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3">
            U
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-sm font-medium">User Name</p>
              <p className="text-xs text-gray-400">Sales Executive</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;