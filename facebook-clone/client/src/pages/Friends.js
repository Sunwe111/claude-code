import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUserFriends, FaUserPlus, FaUsers, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../utils/api';
import './Friends.css';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'all') {
        const response = await api.get('/friends');
        setFriends(response.data.friends);
      } else if (activeTab === 'requests') {
        const response = await api.get('/friends/requests');
        setRequests(response.data.requests);
      } else if (activeTab === 'suggestions') {
        const response = await api.get('/users/suggestions');
        setSuggestions(response.data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      await api.post(`/friends/accept/${userId}`);
      setRequests(prev => prev.filter(r => r.from._id !== userId));
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.delete(`/friends/reject/${userId}`);
      setRequests(prev => prev.filter(r => r.from._id !== userId));
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      await api.post(`/friends/request/${userId}`);
      setSuggestions(prev => prev.filter(s => s._id !== userId));
    } catch (err) {
      console.error('Error sending request:', err);
    }
  };

  const handleUnfriend = async (userId) => {
    if (window.confirm('Are you sure you want to unfriend this person?')) {
      try {
        await api.delete(`/friends/${userId}`);
        setFriends(prev => prev.filter(f => f._id !== userId));
      } catch (err) {
        console.error('Error unfriending:', err);
      }
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-sidebar card">
        <h1>Friends</h1>
        <nav className="friends-nav">
          <button
            className={`nav-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FaUserFriends />
            <span>All Friends</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <FaUserPlus />
            <span>Friend Requests</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <FaUsers />
            <span>Suggestions</span>
          </button>
        </nav>
      </div>

      <div className="friends-content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {activeTab === 'all' && (
              <>
                <h2>All Friends</h2>
                <div className="friends-grid">
                  {friends.map(friend => (
                    <div key={friend._id} className="friend-card card">
                      <Link to={`/profile/${friend._id}`}>
                        <img
                          src={friend.profilePicture || '/default-avatar.png'}
                          alt=""
                          className="friend-avatar"
                        />
                      </Link>
                      <div className="friend-info">
                        <Link to={`/profile/${friend._id}`} className="friend-name">
                          {friend.firstName} {friend.lastName}
                        </Link>
                        {friend.mutualFriends > 0 && (
                          <span className="mutual-friends">{friend.mutualFriends} mutual friends</span>
                        )}
                      </div>
                      <div className="friend-actions">
                        <Link to={`/messages?user=${friend._id}`} className="btn btn-primary">
                          Message
                        </Link>
                        <button className="btn btn-secondary" onClick={() => handleUnfriend(friend._id)}>
                          Unfriend
                        </button>
                      </div>
                    </div>
                  ))}
                  {friends.length === 0 && (
                    <div className="empty-state">
                      <FaUserFriends className="empty-icon" />
                      <p>No friends yet</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'requests' && (
              <>
                <h2>Friend Requests</h2>
                <div className="friends-grid">
                  {requests.map(request => (
                    <div key={request.from._id} className="friend-card card">
                      <Link to={`/profile/${request.from._id}`}>
                        <img
                          src={request.from.profilePicture || '/default-avatar.png'}
                          alt=""
                          className="friend-avatar"
                        />
                      </Link>
                      <div className="friend-info">
                        <Link to={`/profile/${request.from._id}`} className="friend-name">
                          {request.from.firstName} {request.from.lastName}
                        </Link>
                        {request.from.mutualFriends > 0 && (
                          <span className="mutual-friends">{request.from.mutualFriends} mutual friends</span>
                        )}
                      </div>
                      <div className="friend-actions">
                        <button className="btn btn-primary" onClick={() => handleAccept(request.from._id)}>
                          <FaCheck /> Confirm
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleReject(request.from._id)}>
                          <FaTimes /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="empty-state">
                      <FaUserPlus className="empty-icon" />
                      <p>No pending requests</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'suggestions' && (
              <>
                <h2>People You May Know</h2>
                <div className="friends-grid">
                  {suggestions.map(person => (
                    <div key={person._id} className="friend-card card">
                      <Link to={`/profile/${person._id}`}>
                        <img
                          src={person.profilePicture || '/default-avatar.png'}
                          alt=""
                          className="friend-avatar"
                        />
                      </Link>
                      <div className="friend-info">
                        <Link to={`/profile/${person._id}`} className="friend-name">
                          {person.firstName} {person.lastName}
                        </Link>
                        {person.mutualFriends > 0 && (
                          <span className="mutual-friends">{person.mutualFriends} mutual friends</span>
                        )}
                      </div>
                      <div className="friend-actions">
                        <button className="btn btn-primary" onClick={() => handleAddFriend(person._id)}>
                          <FaUserPlus /> Add Friend
                        </button>
                        <button className="btn btn-secondary">Remove</button>
                      </div>
                    </div>
                  ))}
                  {suggestions.length === 0 && (
                    <div className="empty-state">
                      <FaUsers className="empty-icon" />
                      <p>No suggestions available</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Friends;
