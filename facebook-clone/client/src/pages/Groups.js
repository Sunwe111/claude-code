import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaPlus, FaCompass, FaSearch } from 'react-icons/fa';
import api from '../utils/api';
import './Groups.css';

const Groups = () => {
  const [activeTab, setActiveTab] = useState('discover');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await api.get('/groups/my-groups');
      setMyGroups(response.data.groups);
    } catch (err) {
      console.error('Error fetching my groups:', err);
    }
  };

  const handleJoin = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join`);
      fetchGroups();
      fetchMyGroups();
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  const filteredGroups = (activeTab === 'your-groups' ? myGroups : groups).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="groups-page">
      <div className="groups-sidebar card">
        <h1>Groups</h1>
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search groups"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="groups-nav">
          <button
            className={`nav-item ${activeTab === 'your-groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('your-groups')}
          >
            <FaUsers />
            <span>Your groups</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <FaCompass />
            <span>Discover</span>
          </button>
        </nav>

        <button className="btn btn-primary btn-full create-group-btn">
          <FaPlus /> Create new group
        </button>
      </div>

      <div className="groups-content">
        <h2>{activeTab === 'your-groups' ? 'Groups you manage' : 'Suggested for you'}</h2>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="groups-grid">
            {filteredGroups.map(group => (
              <Link to={`/groups/${group._id}`} key={group._id} className="group-card card">
                <img
                  src={group.coverPhoto || '/default-group-cover.jpg'}
                  alt=""
                  className="group-cover"
                />
                <div className="group-info">
                  <h3>{group.name}</h3>
                  <p className="group-meta">
                    {group.memberCount} members · {group.privacy}
                  </p>
                  {activeTab === 'discover' && (
                    <button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        handleJoin(group._id);
                      }}
                    >
                      Join group
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredGroups.length === 0 && (
          <div className="empty-state">
            <FaUsers className="empty-icon" />
            <h3>No groups found</h3>
            <p>Try searching for something else</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
