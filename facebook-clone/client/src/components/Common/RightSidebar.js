import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaEllipsisH, FaVideo, FaCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import './RightSidebar.css';

const RightSidebar = () => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContacts, setShowContacts] = useState(true);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await api.get('/friends');
      setFriends(response.data.friends);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await api.get('/friends/requests');
      setFriendRequests(response.data.requests);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await api.post(`/friends/accept/${userId}`);
      setFriendRequests(prev => prev.filter(req => req.from._id !== userId));
      fetchFriends();
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.delete(`/friends/reject/${userId}`);
      setFriendRequests(prev => prev.filter(req => req.from._id !== userId));
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  const filteredFriends = friends.filter(friend =>
    `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter(friend => isUserOnline(friend._id));
  const offlineFriends = filteredFriends.filter(friend => !isUserOnline(friend._id));

  return (
    <aside className="right-sidebar">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="right-section">
          <h3>Friend Requests</h3>
          {friendRequests.slice(0, 3).map((request) => (
            <div key={request.from._id} className="friend-request">
              <Link to={`/profile/${request.from._id}`}>
                <img
                  src={request.from.profilePicture || '/default-avatar.png'}
                  alt=""
                  className="request-avatar"
                />
              </Link>
              <div className="request-info">
                <Link to={`/profile/${request.from._id}`} className="request-name">
                  {request.from.firstName} {request.from.lastName}
                </Link>
                <div className="request-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAccept(request.from._id)}
                  >
                    Confirm
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleReject(request.from._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {friendRequests.length > 3 && (
            <Link to="/friends/requests" className="see-all">
              See all
            </Link>
          )}
        </div>
      )}

      {/* Sponsored (placeholder) */}
      <div className="right-section">
        <h3>Sponsored</h3>
        <div className="sponsored-ad">
          <img src="/ad-placeholder.jpg" alt="" />
          <div>
            <span className="ad-title">Learn Web Development</span>
            <span className="ad-link">example.com</span>
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Birthdays (placeholder) */}
      <div className="right-section">
        <h3>Birthdays</h3>
        <div className="birthday-notice">
          <span className="birthday-icon">🎂</span>
          <p><strong>John Doe</strong> and <strong>2 others</strong> have birthdays today.</p>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* Contacts */}
      <div className="right-section contacts-section">
        <div className="contacts-header">
          <h3>Contacts</h3>
          <div className="contacts-actions">
            <button className="icon-btn" onClick={() => setShowContacts(true)}>
              <FaVideo />
            </button>
            <button className="icon-btn">
              <FaSearch />
            </button>
            <button className="icon-btn">
              <FaEllipsisH />
            </button>
          </div>
        </div>

        {showContacts && (
          <>
            <div className="contacts-search">
              <input
                type="text"
                placeholder="Search friends"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="contacts-list">
              {/* Online friends first */}
              {onlineFriends.map((friend) => (
                <Link
                  key={friend._id}
                  to={`/messages?user=${friend._id}`}
                  className="contact-item"
                >
                  <div className="contact-avatar-container">
                    <img
                      src={friend.profilePicture || '/default-avatar.png'}
                      alt=""
                      className="contact-avatar"
                    />
                    <span className="online-dot"></span>
                  </div>
                  <span className="contact-name">{friend.firstName} {friend.lastName}</span>
                </Link>
              ))}

              {/* Offline friends */}
              {offlineFriends.map((friend) => (
                <Link
                  key={friend._id}
                  to={`/messages?user=${friend._id}`}
                  className="contact-item"
                >
                  <div className="contact-avatar-container">
                    <img
                      src={friend.profilePicture || '/default-avatar.png'}
                      alt=""
                      className="contact-avatar"
                    />
                  </div>
                  <span className="contact-name">{friend.firstName} {friend.lastName}</span>
                </Link>
              ))}

              {filteredFriends.length === 0 && (
                <p className="no-contacts">No contacts found</p>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
