// EmployeeLayout.jsx
import React, { useState } from 'react';
import EmployeeHeader from './Header';
import EmployeeSidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const EmployeeLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Employee Header */}
      <EmployeeHeader toggleSidebar={toggleSidebar} />
      
      <div className="flex pt-16">
        {/* Employee Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
          <EmployeeSidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>
        
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            onClick={toggleSidebar} 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          ></div>
        )}
        
        {/* Main content - Render child routes here */}
        <main className="flex-1 p-6 lg:ml-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;