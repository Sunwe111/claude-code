import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import './MainLayout.css';

const MainLayout = ({ children, noSidebar = false }) => {
  return (
    <div className="main-layout">
      <Navbar />
      <div className="main-content">
        {!noSidebar && <Sidebar />}
        <main className={`content ${noSidebar ? 'full-width' : ''}`}>
          {children}
        </main>
        {!noSidebar && <RightSidebar />}
      </div>
    </div>
  );
};

export default MainLayout;
