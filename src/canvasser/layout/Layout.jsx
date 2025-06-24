// Layout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import './Layout.css';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="db-dashboard db-dark-mode">
      <Header 
        toggleMobileMenu={toggleMobileMenu} 
        mobileMenuOpen={mobileMenuOpen} 
      />
      <div className="db-main-container">
        <Sidebar 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className="db-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
