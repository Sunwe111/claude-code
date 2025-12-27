import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FaCamera, FaUserPlus, FaPen, FaEllipsisH, FaCheck, FaTimes,
  FaUserFriends, FaImages, FaVideo, FaBriefcase, FaGraduationCap,
  FaHome, FaMapMarkerAlt, FaHeart, FaClock, FaFacebookMessenger
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import CreatePost from '../components/Feed/CreatePost';
import Post from '../components/Feed/Post';
import api from '../utils/api';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [friendStatus, setFriendStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const coverInputRef = useRef();
  const avatarInputRef = useRef();

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setProfile(response.data.user);
      setFriends(response.data.user.friends?.slice(0, 9) || []);

      // Check friend status
      if (!isOwnProfile) {
        checkFriendStatus();
      }

      // Fetch photos
      const photosResponse = await api.get(`/users/${id}/photos`);
      setPhotos(photosResponse.data.photos?.slice(0, 9) || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/posts/user/${id}`);
      setPosts(response.data.posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const checkFriendStatus = async () => {
    try {
      // Check if friends
      const meResponse = await api.get('/auth/me');
      const me = meResponse.data.user;

      if (me.friends?.some(f => f._id === id || f === id)) {
        setFriendStatus('friends');
      } else if (me.sentFriendRequests?.some(r => r.to === id || r.to?._id === id)) {
        setFriendStatus('pending');
      } else if (me.friendRequests?.some(r => r.from === id || r.from?._id === id)) {
        setFriendStatus('respond');
      } else {
        setFriendStatus('none');
      }
    } catch (err) {
      console.error('Error checking friend status:', err);
    }
  };

  const handleFriendAction = async () => {
    try {
      switch (friendStatus) {
        case 'none':
          await api.post(`/friends/request/${id}`);
          setFriendStatus('pending');
          break;
        case 'pending':
          await api.delete(`/friends/cancel/${id}`);
          setFriendStatus('none');
          break;
        case 'respond':
          await api.post(`/friends/accept/${id}`);
          setFriendStatus('friends');
          break;
        case 'friends':
          if (window.confirm('Unfriend this user?')) {
            await api.delete(`/friends/${id}`);
            setFriendStatus('none');
          }
          break;
      }
    } catch (err) {
      console.error('Error with friend action:', err);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('coverPhoto', file);

    try {
      const response = await api.put('/users/cover-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, coverPhoto: response.data.coverPhoto }));
      updateUser({ coverPhoto: response.data.coverPhoto });
    } catch (err) {
      console.error('Error uploading cover:', err);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.put('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, profilePicture: response.data.profilePicture }));
      updateUser({ profilePicture: response.data.profilePicture });
    } catch (err) {
      console.error('Error uploading avatar:', err);
    }
  };

  const getFriendButtonText = () => {
    switch (friendStatus) {
      case 'friends': return 'Friends';
      case 'pending': return 'Request Sent';
      case 'respond': return 'Respond';
      default: return 'Add Friend';
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  if (!profile) {
    return <div className="not-found">Profile not found</div>;
  }

  return (
    <div className="profile-page">
      {/* Cover Photo */}
      <div className="cover-photo-container">
        <div className="cover-photo">
          <img src={profile.coverPhoto || '/default-cover.jpg'} alt="" />
          {isOwnProfile && (
            <button className="edit-cover-btn" onClick={() => coverInputRef.current.click()}>
              <FaCamera />
              <span>Edit cover photo</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleCoverUpload}
          />
        </div>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-container">
            <img
              src={profile.profilePicture || '/default-avatar.png'}
              alt=""
              className="profile-avatar"
            />
            {isOwnProfile && (
              <button className="edit-avatar-btn" onClick={() => avatarInputRef.current.click()}>
                <FaCamera />
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="profile-info">
            <h1>{profile.firstName} {profile.lastName}</h1>
            <p className="friends-count">{profile.friendsCount} friends</p>
            {profile.bio && <p className="bio">{profile.bio}</p>}
          </div>

          <div className="profile-actions">
            {isOwnProfile ? (
              <>
                <button className="btn btn-primary">
                  <FaPlus />
                  <span>Add to Story</span>
                </button>
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                  <FaPen />
                  <span>Edit profile</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className={`btn ${friendStatus === 'friends' ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleFriendAction}
                >
                  {friendStatus === 'friends' ? <FaCheck /> : <FaUserPlus />}
                  <span>{getFriendButtonText()}</span>
                </button>
                <Link to={`/messages?user=${id}`} className="btn btn-secondary">
                  <FaFacebookMessenger />
                  <span>Message</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </button>
          <button
            className={`tab ${activeTab === 'photos' ? 'active' : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        <div className="profile-left">
          {/* Intro */}
          <div className="card profile-card">
            <h3>Intro</h3>
            {profile.bio && <p className="intro-bio">{profile.bio}</p>}

            {profile.workplace?.company && (
              <div className="intro-item">
                <FaBriefcase />
                <span>Works at <strong>{profile.workplace.company}</strong></span>
              </div>
            )}

            {profile.education?.length > 0 && (
              <div className="intro-item">
                <FaGraduationCap />
                <span>Studied at <strong>{profile.education[0].school}</strong></span>
              </div>
            )}

            {profile.location?.city && (
              <div className="intro-item">
                <FaHome />
                <span>Lives in <strong>{profile.location.city}</strong></span>
              </div>
            )}

            {profile.relationship?.status && (
              <div className="intro-item">
                <FaHeart />
                <span>{profile.relationship.status}</span>
              </div>
            )}

            <div className="intro-item">
              <FaClock />
              <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>

            {isOwnProfile && (
              <button className="btn btn-secondary btn-full">Edit Details</button>
            )}
          </div>

          {/* Photos */}
          <div className="card profile-card">
            <div className="card-header">
              <h3>Photos</h3>
              <Link to={`/profile/${id}/photos`}>See all photos</Link>
            </div>
            <div className="photos-grid">
              {photos.map((photo, index) => (
                <img key={index} src={photo.url} alt="" />
              ))}
            </div>
          </div>

          {/* Friends */}
          <div className="card profile-card">
            <div className="card-header">
              <h3>Friends</h3>
              <Link to={`/profile/${id}/friends`}>See all friends</Link>
            </div>
            <p className="friends-count-small">{profile.friendsCount} friends</p>
            <div className="friends-grid">
              {friends.map(friend => (
                <Link key={friend._id} to={`/profile/${friend._id}`} className="friend-item">
                  <img src={friend.profilePicture || '/default-avatar.png'} alt="" />
                  <span>{friend.firstName} {friend.lastName}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-right">
          {/* Create Post */}
          {isOwnProfile && (
            <CreatePost onPost={(newPost) => setPosts(prev => [newPost, ...prev])} />
          )}

          {/* Posts */}
          {posts.map(post => (
            <Post
              key={post._id}
              post={post}
              onUpdate={(updated) => setPosts(prev => prev.map(p => p._id === updated._id ? updated : p))}
              onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
            />
          ))}

          {posts.length === 0 && (
            <div className="no-posts card">
              <p>No posts to show</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FaPlus = () => <span>+</span>;

export default Profile;
