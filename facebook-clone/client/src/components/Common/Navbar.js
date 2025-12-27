import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaFacebookF, FaHome, FaUserFriends, FaUsers, FaStore, FaGamepad,
  FaBell, FaCaretDown, FaSearch, FaCog, FaSignOutAlt, FaMoon,
  FaQuestionCircle, FaExclamationCircle, FaPlus, FaFacebookMessenger
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const searchRef = useRef();
  const notifRef = useRef();
  const menuRef = useRef();
  const createRef = useRef();

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();

    if (socket) {
      socket.on('newNotification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      socket.on('newMessage', () => {
        setMessageCount(prev => prev + 1);
      });
    }

    return () => {
      if (socket) {
        socket.off('newNotification');
        socket.off('newMessage');
      }
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (createRef.current && !createRef.current.contains(e.target)) {
        setShowCreate(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=10');
      setNotifications(response.data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      try {
        const response = await api.get(`/search/suggestions?q=${query}`);
        setSearchResults(response.data.suggestions);
        setShowSearch(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/friends', icon: FaUserFriends, label: 'Friends' },
    { path: '/groups', icon: FaUsers, label: 'Groups' },
    { path: '/marketplace', icon: FaStore, label: 'Marketplace' },
    { path: '/events', icon: FaGamepad, label: 'Gaming' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="logo">
          <FaFacebookF />
        </Link>

        <div className="search-container" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Facebook"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
              />
            </div>
          </form>

          {showSearch && searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((result, index) => (
                <Link
                  key={index}
                  to={`/${result.type === 'user' ? 'profile' : result.type + 's'}/${result.id}`}
                  className="search-result"
                  onClick={() => setShowSearch(false)}
                >
                  <img src={result.image || '/default-avatar.png'} alt="" />
                  <div>
                    <span className="result-name">{result.text}</span>
                    {result.subtitle && <span className="result-type">{result.subtitle}</span>}
                  </div>
                </Link>
              ))}
              <Link
                to={`/search?q=${encodeURIComponent(searchQuery)}`}
                className="search-all"
                onClick={() => setShowSearch(false)}
              >
                <FaSearch />
                <span>Search for "{searchQuery}"</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            title={item.label}
          >
            <item.icon />
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        <div className="nav-icon-container" ref={createRef}>
          <button className="nav-icon-btn" onClick={() => setShowCreate(!showCreate)}>
            <FaPlus />
          </button>
          {showCreate && (
            <div className="dropdown-menu create-menu">
              <Link to="/groups/create" className="dropdown-item">
                <FaUsers />
                <div>
                  <span className="item-title">Group</span>
                  <span className="item-desc">Connect with people who share your interests.</span>
                </div>
              </Link>
              <Link to="/events/create" className="dropdown-item">
                <FaGamepad />
                <div>
                  <span className="item-title">Event</span>
                  <span className="item-desc">Bring people together with a public or private event.</span>
                </div>
              </Link>
              <Link to="/marketplace/create" className="dropdown-item">
                <FaStore />
                <div>
                  <span className="item-title">Listing</span>
                  <span className="item-desc">Sell items to people in your community.</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <Link to="/messages" className="nav-icon-btn">
          <FaFacebookMessenger />
          {messageCount > 0 && <span className="badge">{messageCount}</span>}
        </Link>

        <div className="nav-icon-container" ref={notifRef}>
          <button
            className="nav-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadCount > 0) {
                markAllRead();
              }
            }}
          >
            <FaBell />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="dropdown-menu notifications-menu">
              <div className="notifications-header">
                <h3>Notifications</h3>
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <FaBell />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    >
                      <img
                        src={notification.sender?.profilePicture || '/default-avatar.png'}
                        alt=""
                      />
                      <div className="notification-content">
                        <p>{notification.content}</p>
                        <span className="notification-time">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link to="/notifications" className="see-all-link">
                See All Notifications
              </Link>
            </div>
          )}
        </div>

        <div className="nav-icon-container" ref={menuRef}>
          <button
            className="nav-icon-btn profile-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt=""
              className="nav-avatar"
            />
            <FaCaretDown className="caret" />
          </button>

          {showMenu && (
            <div className="dropdown-menu account-menu">
              <Link to={`/profile/${user?.id}`} className="profile-link">
                <img src={user?.profilePicture || '/default-avatar.png'} alt="" />
                <div>
                  <span className="user-name">{user?.firstName} {user?.lastName}</span>
                  <span className="see-profile">See your profile</span>
                </div>
              </Link>

              <div className="menu-divider"></div>

              <Link to="/settings" className="dropdown-item">
                <div className="item-icon"><FaCog /></div>
                <span>Settings & privacy</span>
              </Link>
              <Link to="/help" className="dropdown-item">
                <div className="item-icon"><FaQuestionCircle /></div>
                <span>Help & support</span>
              </Link>
              <button className="dropdown-item">
                <div className="item-icon"><FaMoon /></div>
                <span>Display & accessibility</span>
              </button>
              <button className="dropdown-item">
                <div className="item-icon"><FaExclamationCircle /></div>
                <span>Give feedback</span>
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <div className="item-icon"><FaSignOutAlt /></div>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
