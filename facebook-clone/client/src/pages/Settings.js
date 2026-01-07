import React, { useState, useContext } from 'react';
import { FaUser, FaLock, FaShieldAlt, FaBell, FaGlobe, FaMoon, FaSignOutAlt, FaTrash, FaChevronRight, FaCheck } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Settings.css';

const Settings = () => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [generalSettings, setGeneralSettings] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || ''
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.privacy?.profileVisibility || 'public',
    friendsListVisibility: user?.privacy?.friendsListVisibility || 'friends',
    postsVisibility: user?.privacy?.postsVisibility || 'friends',
    allowTagging: user?.privacy?.allowTagging || true,
    allowMessagesFrom: user?.privacy?.allowMessagesFrom || 'everyone'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    friendRequests: true,
    messages: true,
    comments: true,
    likes: true,
    mentions: true,
    groupActivity: true,
    eventReminders: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/users/profile', generalSettings);
      updateUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/privacy', privacySettings);
      setMessage({ type: 'success', text: 'Privacy settings updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error updating privacy settings' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error changing password' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/notifications', notificationSettings);
      setMessage({ type: 'success', text: 'Notification settings updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error updating notification settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/users/account');
        logout();
      } catch (err) {
        setMessage({ type: 'error', text: 'Error deleting account' });
      }
    }
  };

  const menuItems = [
    { id: 'general', label: 'General', icon: FaUser },
    { id: 'security', label: 'Security and Login', icon: FaLock },
    { id: 'privacy', label: 'Privacy', icon: FaShieldAlt },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'language', label: 'Language and Region', icon: FaGlobe },
    { id: 'appearance', label: 'Appearance', icon: FaMoon }
  ];

  return (
    <div className="settings-page">
      <div className="settings-sidebar card">
        <h1>Settings</h1>
        <nav className="settings-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <item.icon />
              <span>{item.label}</span>
              <FaChevronRight className="chevron" />
            </button>
          ))}
        </nav>

        <div className="settings-actions">
          <button className="action-item logout" onClick={logout}>
            <FaSignOutAlt />
            <span>Log Out</span>
          </button>
          <button className="action-item delete" onClick={handleDeleteAccount}>
            <FaTrash />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      <div className="settings-content">
        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' && <FaCheck />}
            {message.text}
          </div>
        )}

        {activeSection === 'general' && (
          <div className="settings-section card">
            <h2>General Account Settings</h2>
            <form onSubmit={handleGeneralSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={generalSettings.firstName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={generalSettings.lastName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={generalSettings.username}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={generalSettings.email}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="settings-section card">
            <h2>Security and Login</h2>
            <h3>Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="settings-section card">
            <h2>Privacy Settings</h2>
            <form onSubmit={handlePrivacySubmit}>
              <div className="form-group">
                <label>Who can see your profile?</label>
                <select
                  value={privacySettings.profileVisibility}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                >
                  <option value="public">Everyone</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Only me</option>
                </select>
              </div>
              <div className="form-group">
                <label>Who can see your friends list?</label>
                <select
                  value={privacySettings.friendsListVisibility}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, friendsListVisibility: e.target.value })}
                >
                  <option value="public">Everyone</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Only me</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default post audience</label>
                <select
                  value={privacySettings.postsVisibility}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, postsVisibility: e.target.value })}
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends</option>
                  <option value="private">Only me</option>
                </select>
              </div>
              <div className="form-group">
                <label>Who can message you?</label>
                <select
                  value={privacySettings.allowMessagesFrom}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, allowMessagesFrom: e.target.value })}
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends">Friends only</option>
                  <option value="none">No one</option>
                </select>
              </div>
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowTagging}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, allowTagging: e.target.checked })}
                  />
                  Allow others to tag you in posts and photos
                </label>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </form>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="settings-section card">
            <h2>Notification Settings</h2>
            <form onSubmit={handleNotificationSubmit}>
              <div className="notification-group">
                <h3>Delivery Methods</h3>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    />
                    Email notifications
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                    />
                    Push notifications
                  </label>
                </div>
              </div>

              <div className="notification-group">
                <h3>Activity Notifications</h3>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.friendRequests}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, friendRequests: e.target.checked })}
                    />
                    Friend requests
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.messages}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, messages: e.target.checked })}
                    />
                    Messages
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.comments}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, comments: e.target.checked })}
                    />
                    Comments on your posts
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.likes}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, likes: e.target.checked })}
                    />
                    Likes on your posts
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.mentions}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, mentions: e.target.checked })}
                    />
                    Mentions
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.groupActivity}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, groupActivity: e.target.checked })}
                    />
                    Group activity
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.eventReminders}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, eventReminders: e.target.checked })}
                    />
                    Event reminders
                  </label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </form>
          </div>
        )}

        {activeSection === 'language' && (
          <div className="settings-section card">
            <h2>Language and Region</h2>
            <div className="form-group">
              <label>Language</label>
              <select defaultValue="en">
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
            </div>
            <div className="form-group">
              <label>Region</label>
              <select defaultValue="us">
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
                <option value="de">Germany</option>
                <option value="fr">France</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date Format</label>
              <select defaultValue="mdy">
                <option value="mdy">MM/DD/YYYY</option>
                <option value="dmy">DD/MM/YYYY</option>
                <option value="ymd">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="settings-section card">
            <h2>Appearance</h2>
            <div className="form-group">
              <label>Theme</label>
              <div className="theme-options">
                <button className="theme-option active">
                  <div className="theme-preview light"></div>
                  <span>Light</span>
                </button>
                <button className="theme-option">
                  <div className="theme-preview dark"></div>
                  <span>Dark</span>
                </button>
                <button className="theme-option">
                  <div className="theme-preview system"></div>
                  <span>System</span>
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Font Size</label>
              <select defaultValue="medium">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" defaultChecked />
                Enable animations
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
