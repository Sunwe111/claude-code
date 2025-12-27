import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaGlobeAmericas, FaLock, FaUsers, FaEllipsisH, FaPlus, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import CreatePost from '../components/Feed/CreatePost';
import Post from '../components/Feed/Post';
import api from '../utils/api';
import './GroupDetail.css';

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion');
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    fetchGroup();
    fetchPosts();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data.group);
      setIsMember(response.data.group.members.some(m => m.user._id === user.id));
    } catch (err) {
      console.error('Error fetching group:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/groups/${id}/posts`);
      setPosts(response.data.posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handleJoin = async () => {
    try {
      await api.post(`/groups/${id}/join`);
      fetchGroup();
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  const handleLeave = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await api.delete(`/groups/${id}/leave`);
        fetchGroup();
      } catch (err) {
        console.error('Error leaving group:', err);
      }
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  if (!group) {
    return <div className="not-found">Group not found</div>;
  }

  return (
    <div className="group-detail-page">
      <div className="group-header">
        <div className="group-cover">
          <img src={group.coverPhoto || '/default-group-cover.jpg'} alt="" />
        </div>
        <div className="group-header-content">
          <h1>{group.name}</h1>
          <div className="group-meta">
            {group.privacy === 'public' ? <FaGlobeAmericas /> : <FaLock />}
            <span>{group.privacy} group</span>
            <span>·</span>
            <span>{group.memberCount} members</span>
          </div>
          <div className="group-actions">
            {isMember ? (
              <>
                <button className="btn btn-secondary" onClick={handleLeave}>
                  Leave Group
                </button>
                <button className="btn btn-secondary">
                  <FaUserPlus /> Invite
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleJoin}>
                <FaPlus /> Join Group
              </button>
            )}
            <button className="btn btn-secondary">
              <FaEllipsisH />
            </button>
          </div>
        </div>

        <div className="group-tabs">
          <button
            className={`tab ${activeTab === 'discussion' ? 'active' : ''}`}
            onClick={() => setActiveTab('discussion')}
          >
            Discussion
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>
      </div>

      <div className="group-content">
        <div className="group-main">
          {activeTab === 'discussion' && (
            <>
              {isMember && (
                <CreatePost
                  onPost={(newPost) => setPosts(prev => [newPost, ...prev])}
                />
              )}
              {posts.map(post => (
                <Post
                  key={post._id}
                  post={post}
                  onUpdate={(updated) => setPosts(prev =>
                    prev.map(p => p._id === updated._id ? updated : p)
                  )}
                  onDelete={(postId) => setPosts(prev =>
                    prev.filter(p => p._id !== postId)
                  )}
                />
              ))}
              {posts.length === 0 && (
                <div className="no-posts card">
                  <p>No posts yet. Be the first to post!</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <div className="members-section card">
              <h3>Members · {group.memberCount}</h3>
              <div className="members-grid">
                {group.members.map(member => (
                  <Link
                    key={member.user._id}
                    to={`/profile/${member.user._id}`}
                    className="member-item"
                  >
                    <img
                      src={member.user.profilePicture || '/default-avatar.png'}
                      alt=""
                    />
                    <div>
                      <span className="member-name">
                        {member.user.firstName} {member.user.lastName}
                      </span>
                      {member.role !== 'member' && (
                        <span className="member-role">{member.role}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="about-section card">
              <h3>About this group</h3>
              <p>{group.description || 'No description provided.'}</p>
              <div className="about-item">
                {group.privacy === 'public' ? <FaGlobeAmericas /> : <FaLock />}
                <div>
                  <strong>{group.privacy === 'public' ? 'Public' : 'Private'}</strong>
                  <p>
                    {group.privacy === 'public'
                      ? 'Anyone can see who\'s in the group and what they post.'
                      : 'Only members can see who\'s in the group and what they post.'}
                  </p>
                </div>
              </div>
              {group.rules?.length > 0 && (
                <div className="group-rules">
                  <h4>Group Rules</h4>
                  {group.rules.map((rule, index) => (
                    <div key={index} className="rule-item">
                      <span className="rule-number">{index + 1}</span>
                      <div>
                        <strong>{rule.title}</strong>
                        <p>{rule.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="group-sidebar">
          <div className="card">
            <h4>About</h4>
            <p>{group.description?.substring(0, 150) || 'No description.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
