import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';


function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  // Render the active page content
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
       
      case 'user-management':
   
       
      case 'maps':
      case 'create-route':
      case 'route-lists':
       
    
    
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/40">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        activePage={activePage} 
        setActivePage={setActivePage} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activePage={activePage}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default App;