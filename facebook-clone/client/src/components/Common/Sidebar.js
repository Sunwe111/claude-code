import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaUserFriends, FaUsers, FaStore, FaCalendarAlt, FaClock,
  FaBookmark, FaFlag, FaPlayCircle, FaGamepad, FaHeart,
  FaChevronDown
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const mainLinks = [
    { path: `/profile/${user?.id}`, icon: null, label: user?.firstName + ' ' + user?.lastName, isProfile: true },
    { path: '/friends', icon: FaUserFriends, label: 'Friends', color: '#1877f2' },
    { path: '/groups', icon: FaUsers, label: 'Groups', color: '#1877f2' },
    { path: '/marketplace', icon: FaStore, label: 'Marketplace', color: '#1877f2' },
    { path: '/events', icon: FaCalendarAlt, label: 'Events', color: '#e74c3c' },
    { path: '/memories', icon: FaClock, label: 'Memories', color: '#1877f2' },
    { path: '/saved', icon: FaBookmark, label: 'Saved', color: '#a855f7' },
    { path: '/pages', icon: FaFlag, label: 'Pages', color: '#f97316' },
    { path: '/watch', icon: FaPlayCircle, label: 'Watch', color: '#1877f2' },
    { path: '/gaming', icon: FaGamepad, label: 'Gaming', color: '#1877f2' },
    { path: '/fundraisers', icon: FaHeart, label: 'Fundraisers', color: '#e74c3c' },
  ];

  const shortcuts = [
    { id: 1, name: 'React Developers', image: '/default-group.png', path: '/groups/1' },
    { id: 2, name: 'JavaScript Community', image: '/default-group.png', path: '/groups/2' },
    { id: 3, name: 'Web Developers Hub', image: '/default-group.png', path: '/groups/3' },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {mainLinks.slice(0, 8).map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
          >
            {link.isProfile ? (
              <img
                src={user?.profilePicture || '/default-avatar.png'}
                alt=""
                className="sidebar-avatar"
              />
            ) : (
              <div className="sidebar-icon" style={{ backgroundColor: link.color }}>
                <link.icon />
              </div>
            )}
            <span>{link.label}</span>
          </Link>
        ))}

        <button className="sidebar-link see-more">
          <div className="sidebar-icon see-more-icon">
            <FaChevronDown />
          </div>
          <span>See more</span>
        </button>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="shortcuts-section">
        <h3>Your shortcuts</h3>
        {shortcuts.map((shortcut) => (
          <Link
            key={shortcut.id}
            to={shortcut.path}
            className="sidebar-link"
          >
            <img
              src={shortcut.image}
              alt=""
              className="shortcut-image"
            />
            <span>{shortcut.name}</span>
          </Link>
        ))}
      </div>

      <footer className="sidebar-footer">
        <p>Privacy · Terms · Advertising · Ad Choices · Cookies · More · Meta © 2024</p>
      </footer>
    </aside>
  );
};

export default Sidebar;
