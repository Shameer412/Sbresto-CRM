// src/employee/dashboard/Header.jsx
import React from 'react';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const EmployeeHeader = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add your logout logic here (clear tokens, etc.)
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md p-4 fixed top-0 w-full z-50">
      <div className="flex justify-between items-center">
        {/* LEFT SIDE */}
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="text-gray-600 hover:text-blue-500 mr-4 lg:hidden"
          >
            <FiMenu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Employee Dashboard
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-blue-500 text-2xl">
            <FaUserCircle />
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 py-2 px-4 rounded-lg transition-colors"
          >
            <FiLogOut />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default EmployeeHeader;