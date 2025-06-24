import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome, FiLogOut, FiChevronDown, FiChevronRight
} from 'react-icons/fi';
import { FaUserCircle, FaChartLine, FaRegClock, FaUserPlus } from 'react-icons/fa';
import { HiOutlineUserGroup, HiOutlineDocumentReport } from 'react-icons/hi';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { useGetUserLeadsQuery } from '../../features/api/apiSlice';

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const dispatch = useDispatch();
  const { data: userData, isLoading: userLoading } = useGetUserLeadsQuery();
  const username = userData?.name || userData?.username || 'User';
  const [leadsOpen, setLeadsOpen] = useState(false);
  const location = useLocation();

  // Open Leads menu if we're on a leads route
  useEffect(() => {
    if (location.pathname.includes('/leads')) {
      setLeadsOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

  const handleNavClick = () => {
    if (mobileMenuOpen && setMobileMenuOpen) setMobileMenuOpen(false);
  };

  const isLeadsRoute = location.pathname.includes('/leads');

  return (
    <aside className={`db-sidebar ${mobileMenuOpen ? 'db-open' : ''}`}>
      <nav className="db-sidebar-nav">
        <div className="db-nav-section">
          <h3 className="db-nav-title">MAIN</h3>
          <ul>
            <li>
              <NavLink
                to="/hyee"
                className={({ isActive }) => isActive ? 'db-active' : ''}
                onClick={handleNavClick}
              >
                <FiHome className="db-nav-icon" />
                <span className="db-nav-text">Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/analytics"
                className={({ isActive }) => isActive ? 'db-active' : ''}
                onClick={handleNavClick}
              >
                <FaChartLine className="db-nav-icon" />
                <span className="db-nav-text">Analytics</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="db-nav-section">
          <h3 className="db-nav-title">MANAGEMENT</h3>
          <ul>
            {/* Leads Dropdown */}
            <li>
              <button
                className={`db-dropdown-btn ${isLeadsRoute ? 'db-active' : ''}`}
                onClick={() => setLeadsOpen(prev => !prev)}
                aria-expanded={leadsOpen}
                type="button"
              >
                <HiOutlineUserGroup className="db-nav-icon" />
                <span className="db-nav-text">Leads</span>
                {leadsOpen ? (
                  <FiChevronDown className="db-dropdown-arrow" />
                ) : (
                  <FiChevronRight className="db-dropdown-arrow" />
                )}
              </button>
              {leadsOpen && (
                <ul className="db-submenu">
                  <li>
                    <NavLink
                      to="/leads"  // Changed from "leads/add" to "/leads"
                      className={({ isActive }) => isActive ? 'db-active' : ''}
                      onClick={handleNavClick}
                    >
                      <HiOutlineUserGroup size={18} />
                      <span className="db-nav-text1">All Leads</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/leads/add"  // Changed from "leads/add" to "/leads/add"
                      className={({ isActive }) => isActive ? 'db-active' : ''}
                      onClick={handleNavClick}
                    >
                      <FaUserPlus size={18} />
                      <span className="db-nav-text1">Add Lead</span>
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <NavLink
                to="/reports"
                className={({ isActive }) => isActive ? 'db-active' : ''}
                onClick={handleNavClick}
              >
                <HiOutlineDocumentReport className="db-nav-icon" />
                <span className="db-nav-text">Reports</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/followup"
                className={({ isActive }) => isActive ? 'db-active' : ''}
                onClick={handleNavClick}
              >
                <FaRegClock className="db-nav-icon" />
                <span className="db-nav-text">Follow Up</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      <div className="db-sidebar-footer">
        <div className="db-profile-card">
          <div className="db-profile-info">
            <FaUserCircle size={40} className="db-profile-avatar" />
            <div className="db-profile-details">
              <h4>{userLoading ? "..." : username}</h4>
            </div>
          </div>
          <button className="db-logout-btn" onClick={handleLogout}>
            <span>Log Out</span>
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;