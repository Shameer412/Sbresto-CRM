import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBullhorn, FaPlus, FaList } from 'react-icons/fa';
import { RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri';
import { AiOutlineClose } from 'react-icons/ai';

const EmployeeSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const activeLink = 'bg-blue-600 text-white';
  const normalLink = 'hover:bg-gray-200';

  return (
    <aside className={`bg-white text-gray-800 w-64 min-h-screen p-4 fixed lg:static z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      
      {/* Header with Logo and Close Button */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={toggleSidebar} className="lg:hidden text-gray-600 hover:text-red-500">
          <AiOutlineClose size={24} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav>
        <ul>
          <li>
            <NavLink to="/employee/dashboard" className={({ isActive }) => `flex items-center p-3 rounded-lg ${isActive ? activeLink : normalLink}`}>
              <FaTachometerAlt className="mr-3" /> Dashboard
            </NavLink>
          </li>
          <li className="my-2">
            <div onClick={() => setIsLeadOpen(!isLeadOpen)} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-200">
              <div className="flex items-center">
                <FaBullhorn className="mr-3" /> Leads
              </div>
              {isLeadOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
            </div>
            {isLeadOpen && (
              <ul className="pl-8 mt-2 space-y-2">
                <li>
                  <NavLink to="/employee/leadlist" className={({ isActive }) => `flex items-center p-2 rounded-lg ${isActive ? activeLink : normalLink}`}>
                    <FaList className="mr-3" /> Lead List
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/employee/leadlist/add" className={({ isActive }) => `flex items-center p-2 rounded-lg ${isActive ? activeLink : normalLink}`}>
                    <FaPlus className="mr-3" /> Add Lead
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default EmployeeSidebar;