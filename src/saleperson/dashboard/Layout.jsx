import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import DashboardContent from './DashboardContent';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close sidebar on mobile when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Mobile menu button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800"
      >
        ☰
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} />
        <DashboardContent activeTab={activeTab} />
      </div>
    </div>
  );
};

export default DashboardLayout;