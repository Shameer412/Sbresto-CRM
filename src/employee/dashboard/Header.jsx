import React from 'react';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const EmployeeHeader = ({ toggleSidebar }) => {
  const navigate = useNavigate();

  // --- Profile Button Handler ---
  const handleProfile = () => {
    // navigate to employee profile page
    navigate('/employee/profile/view');
  };

  // --- Logout Handler ---
  const handleLogout = () => {
    // 🔐 clear authentication info (adjust to your auth method)
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');

    // redirect to login page
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
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Employee Dashboard
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          {/* Profile Button */}
          <button
            onClick={handleProfile}
            className="text-gray-600 hover:text-blue-500 text-2xl transition-colors"
            aria-label="Profile"
          >
            <FaUserCircle />
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-100 hover:bg-red-100 
                       text-gray-700 hover:text-red-600 py-2 px-4 rounded-lg 
                       transition-colors"
            aria-label="Logout"
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
