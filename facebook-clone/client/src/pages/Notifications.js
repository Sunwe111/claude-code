import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaThumbsUp, FaComment, FaUserPlus, FaUsers, FaCalendarAlt, FaStore, FaCheck, FaEllipsisH } from 'react-icons/fa';
import { timeAgo } from '../utils/helpers';
import api from '../utils/api';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n =>
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FaThumbsUp className="notif-icon like" />;
      case 'comment':
        return <FaComment className="notif-icon comment" />;
      case 'friend_request':
      case 'friend_accepted':
        return <FaUserPlus className="notif-icon friend" />;
      case 'group_invite':
      case 'group_post':
        return <FaUsers className="notif-icon group" />;
      case 'event_invite':
      case 'event_reminder':
        return <FaCalendarAlt className="notif-icon event" />;
      case 'marketplace':
        return <FaStore className="notif-icon marketplace" />;
      default:
        return <FaBell className="notif-icon default" />;
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'like':
      case 'comment':
        return `/post/${notification.reference}`;
      case 'friend_request':
      case 'friend_accepted':
        return `/profile/${notification.sender._id}`;
      case 'group_invite':
      case 'group_post':
        return `/groups/${notification.reference}`;
      case 'event_invite':
      case 'event_reminder':
        return `/events/${notification.reference}`;
      case 'marketplace':
        return `/marketplace/${notification.reference}`;
      default:
        return '#';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="notifications-container card">
        <div className="notifications-header">
          <h1>Notifications</h1>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                <FaCheck /> Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.length === 0 ? (
              <div className="empty-state">
                <FaBell className="empty-icon" />
                <h3>No notifications</h3>
                <p>You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <Link
                  to={getNotificationLink(notification)}
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => !notification.read && markAsRead(notification._id)}
                >
                  <div className="notification-avatar">
                    <img
                      src={notification.sender?.profilePicture || '/default-avatar.png'}
                      alt=""
                    />
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p>
                      <strong>{notification.sender?.firstName} {notification.sender?.lastName}</strong>
                      {' '}{notification.message}
                    </p>
                    <span className="notification-time">{timeAgo(notification.createdAt)}</span>
                  </div>
                  <button className="notification-menu" onClick={(e) => e.preventDefault()}>
                    <FaEllipsisH />
                  </button>
                  {!notification.read && <div className="unread-dot"></div>}
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
