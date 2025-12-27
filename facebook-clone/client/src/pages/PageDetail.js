import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaThumbsUp, FaFacebookMessenger, FaStar, FaPhone, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Post from '../components/Feed/Post';
import api from '../utils/api';
import './PageDetail.css';

const PageDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    fetchPage();
    fetchPosts();
  }, [id]);

  const fetchPage = async () => {
    try {
      const response = await api.get(`/pages/${id}`);
      setPage(response.data.page);
      setIsLiked(response.data.page.likes?.includes(user?.id));
    } catch (err) {
      console.error('Error fetching page:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/pages/${id}/posts`);
      setPosts(response.data.posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handleLike = async () => {
    try {
      await api.post(`/pages/${id}/like`);
      setIsLiked(!isLiked);
      setPage(prev => ({
        ...prev,
        likeCount: isLiked ? prev.likeCount - 1 : prev.likeCount + 1
      }));
    } catch (err) {
      console.error('Error liking page:', err);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  if (!page) {
    return <div className="not-found">Page not found</div>;
  }

  return (
    <div className="page-detail">
      <div className="page-header">
        <div className="page-cover">
          <img src={page.coverPhoto || '/default-page-cover.jpg'} alt="" />
        </div>
        <div className="page-header-content">
          <img
            src={page.profilePicture || '/default-page-avatar.png'}
            alt=""
            className="page-profile"
          />
          <div className="page-header-info">
            <h1>
              {page.name}
              {page.isVerified && <span className="verified-badge">✓</span>}
            </h1>
            <p className="page-category">{page.category}</p>
            <p className="page-stats">
              {page.likeCount} likes · {page.followerCount} followers
            </p>
            {page.rating?.count > 0 && (
              <p className="page-rating">
                <FaStar /> {page.rating.average.toFixed(1)} ({page.rating.count} reviews)
              </p>
            )}
          </div>
          <div className="page-actions">
            <button
              className={`btn ${isLiked ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleLike}
            >
              <FaThumbsUp /> {isLiked ? 'Liked' : 'Like'}
            </button>
            <button className="btn btn-secondary">
              <FaFacebookMessenger /> Message
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="page-main">
          <div className="page-tabs card">
            <button className="tab active">Posts</button>
            <button className="tab">About</button>
            <button className="tab">Reviews</button>
            <button className="tab">Photos</button>
          </div>

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
              <p>No posts yet</p>
            </div>
          )}
        </div>

        <div className="page-sidebar">
          <div className="card page-about-card">
            <h3>About</h3>
            <p>{page.description || 'No description provided.'}</p>

            {page.contact?.website && (
              <div className="about-item">
                <FaGlobe />
                <a href={page.contact.website} target="_blank" rel="noopener noreferrer">
                  {page.contact.website}
                </a>
              </div>
            )}

            {page.contact?.phone && (
              <div className="about-item">
                <FaPhone />
                <span>{page.contact.phone}</span>
              </div>
            )}

            {page.contact?.address?.city && (
              <div className="about-item">
                <FaMapMarkerAlt />
                <span>
                  {page.contact.address.street}, {page.contact.address.city}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageDetail;
