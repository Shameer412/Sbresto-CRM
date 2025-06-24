// components/Header.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetUserLeadsQuery,
  useGetNotificationsQuery,
} from '../../features/api/apiSlice'; // Path apne project ke hisaab se set karo
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice'; // Path apne hisaab se
import {
  FiMenu, FiX, FiBell, FiUser, FiLogOut, FiChevronDown
} from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import Notification from '../../canvasser/notification/Notification';

const Header = ({ toggleMobileMenu, mobileMenuOpen }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dispatch = useDispatch();

  // Get user data from RTK Query
  const { data: userData, isLoading: userLoading } = useGetUserLeadsQuery();
  // Use correct path for username based on your API response
const username = userData?.name || userData?.username || 'User';


  // Get notifications data from RTK Query
  const { data: notificationData, isLoading: notificationLoading } = useGetNotificationsQuery();
  const unreadCount = notificationData?.unread_count || 0;

  const toggleProfileMenu = () => {
    setProfileMenuOpen((open) => !open);
  };

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/login';
  };

 const navigate = useNavigate();
  const handleProfileClick = () => {
    navigate("/profile");
    setProfileMenuOpen(false);
  };
console.log(userData);
  return (
    <header className="db-header">
      <div className="db-header-left">
        <button className="db-menu-toggle" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <div className="db-logo">
          <h1 className="db-logo-text db-logo-text-full">Southern Belle Restorations</h1>
          <h1 className="db-logo-text db-logo-text-short">SBR</h1>
        </div>
      </div>

      <div className="db-header-right">
        {/* Notification Bell */}
        <button
          className="db-notification-btn"
          onClick={() => setNotificationOpen((open) => !open)}
          style={{ position: "relative" }}
          aria-label="Notifications"
        >
          <FiBell size={20} />
          {!notificationLoading && unreadCount > 0 && (
            <span className="db-notification-badge">{unreadCount}</span>
          )}
        </button>
        <Notification
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />

        <div className="db-profile-dropdown">
          <button className="db-profile-btn" onClick={toggleProfileMenu}>
            <div className="db-avatar">
              <FaUserCircle size={24} />
            </div>
            <span className="db-profile-name">
              {userLoading ? "..." : username}
            </span>
            <FiChevronDown size={16} className={`db-dropdown-icon ${profileMenuOpen ? 'db-open' : ''}`} />
          </button>

          {profileMenuOpen && (
            <div className="db-dropdown-menu">
              <button className="db-dropdown-item" onClick={handleProfileClick}>
                <FiUser size={16} />
                <span>Profile</span>
              </button>
              <button className="db-dropdown-item" onClick={handleLogout}>
                <FiLogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
