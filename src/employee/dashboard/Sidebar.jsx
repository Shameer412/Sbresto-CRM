import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaChartLine,
  FaUsers,
  FaPlus,
  FaClipboardList,
  FaClipboardCheck,
  FaRegCalendarAlt,
  FaCalendarPlus,
  FaHandshake,
  FaMap,
  FaMapSigns
} from 'react-icons/fa';
import { RiArrowDownSLine, RiArrowUpSLine } from 'react-icons/ri';
import { AiOutlineClose } from 'react-icons/ai';

const EmployeeSidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const [isLeadsOpen, setIsLeadsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const activeLink = 'bg-blue-600 text-white';
  const normalLink = 'hover:bg-gray-200';

  return (
    <aside
      className={`bg-white text-gray-800 w-64 min-h-screen p-4 fixed lg:static z-30 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      {/* Header with Close Button (mobile) */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-600 hover:text-red-500"
        >
          <AiOutlineClose size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav>
        <ul>
          <li>
            <NavLink
              to="/employee/dashboard"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg ${
                  isActive ? activeLink : normalLink
                }`
              }
            >
              <FaTachometerAlt className="mr-3" /> Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/employee/stats"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg ${
                  isActive ? activeLink : normalLink
                }`
              }
            >
              <FaChartLine className="mr-3" /> Analytics
            </NavLink>
          </li>

          {/* Leads */}
          <li className="my-2">
            <div
              onClick={() => setIsLeadsOpen(!isLeadsOpen)}
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-200"
            >
              <div className="flex items-center">
                <FaUsers className="mr-3" /> Leads
              </div>
              {isLeadsOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
            </div>
            {isLeadsOpen && (
              <ul className="pl-8 mt-2 space-y-2">
                <li>
                  <NavLink
                    to="/employee/leadlist"
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-lg ${
                        isActive ? activeLink : normalLink
                      }`
                    }
                  >
                    <FaClipboardList className="mr-3" /> Lead List
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/employee/leadlist/add"
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-lg ${
                        isActive ? activeLink : normalLink
                      }`
                    }
                  >
                    <FaPlus className="mr-3" /> Add Lead
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Follow-Ups */}
          <li>
            <NavLink
              to="/employee/followup/list"
              className={({ isActive }) =>
                `flex items-center p-3 rounded-lg ${
                  isActive ? activeLink : normalLink
                }`
              }
            >
              <FaClipboardList className="mr-3" /> Follow-Up List
            </NavLink>
          </li>

          {/* Calendar */}
          <li className="my-2">
            <div
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-200"
            >
              <div className="flex items-center">
                <FaRegCalendarAlt className="mr-3" /> Calendar
              </div>
              {isCalendarOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
            </div>
            {isCalendarOpen && (
              <ul className="pl-8 mt-2 space-y-2">
                <li>
                  <NavLink
                    to="/employee/meeting/calender"
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-lg ${
                        isActive ? activeLink : normalLink
                      }`
                    }
                  >
                    <FaCalendarPlus className="mr-3" /> Scheduler
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/employee/meeting/schedule"
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-lg ${
                        isActive ? activeLink : normalLink
                      }`
                    }
                  >
                    <FaHandshake className="mr-3" /> Book Meetings
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/employee/meeting/list"
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-lg ${
                        isActive ? activeLink : normalLink
                      }`
                    }
                  >
                    <FaClipboardCheck className="mr-3" /> Meeting List
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Map */}
          <li className="my-2">
            <div
              onClick={() => setIsMapOpen(!isMapOpen)}
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-200"
            >
              <div className="flex items-center">
                <FaMap className="mr-3" /> Map
              </div>
              {isMapOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
            </div>
            {isMapOpen && (
              <ul className="pl-8 mt-2 space-y-2">
                <li>
                  <NavLink
                    to="/employee/territory/list"
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-lg ${
                        isActive ? activeLink : normalLink
                      }`
                    }
                  >
                    <FaMapSigns className="mr-3" /> Territory List
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
