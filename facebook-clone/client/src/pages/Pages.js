import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFlag, FaPlus, FaThumbsUp, FaStar } from 'react-icons/fa';
import api from '../utils/api';
import './Pages.css';

const Pages = () => {
  const [pages, setPages] = useState([]);
  const [myPages, setMyPages] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
    fetchMyPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await api.get('/pages');
      setPages(response.data.pages);
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPages = async () => {
    try {
      const response = await api.get('/pages/my-pages');
      setMyPages(response.data.pages);
    } catch (err) {
      console.error('Error fetching my pages:', err);
    }
  };

  const handleLike = async (pageId, e) => {
    e.preventDefault();
    try {
      await api.post(`/pages/${pageId}/like`);
      fetchPages();
    } catch (err) {
      console.error('Error liking page:', err);
    }
  };

  const displayPages = activeTab === 'your-pages' ? myPages : pages;

  return (
    <div className="pages-page">
      <div className="pages-sidebar card">
        <h1>Pages</h1>
        <nav className="pages-nav">
          <button
            className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <FaFlag />
            <span>Discover</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'your-pages' ? 'active' : ''}`}
            onClick={() => setActiveTab('your-pages')}
          >
            <FaFlag />
            <span>Your Pages</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'liked' ? 'active' : ''}`}
            onClick={() => setActiveTab('liked')}
          >
            <FaThumbsUp />
            <span>Liked Pages</span>
          </button>
        </nav>
        <button className="btn btn-primary btn-full">
          <FaPlus /> Create new Page
        </button>
      </div>

      <div className="pages-content">
        <h2>{activeTab === 'your-pages' ? 'Your Pages' : 'Discover Pages'}</h2>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="pages-grid">
            {displayPages.map(page => (
              <Link to={`/pages/${page._id}`} key={page._id} className="page-card card">
                <img
                  src={page.profilePicture || '/default-page-avatar.png'}
                  alt=""
                  className="page-avatar"
                />
                <div className="page-info">
                  <h3>
                    {page.name}
                    {page.isVerified && <span className="verified">✓</span>}
                  </h3>
                  <p className="page-category">{page.category}</p>
                  <p className="page-followers">{page.followerCount} followers</p>
                  {page.rating?.count > 0 && (
                    <p className="page-rating">
                      <FaStar /> {page.rating.average.toFixed(1)} ({page.rating.count})
                    </p>
                  )}
                </div>
                {activeTab === 'discover' && (
                  <button
                    className="btn btn-secondary"
                    onClick={(e) => handleLike(page._id, e)}
                  >
                    <FaThumbsUp /> Like
                  </button>
                )}
              </Link>
            ))}
          </div>
        )}

        {!loading && displayPages.length === 0 && (
          <div className="empty-state">
            <FaFlag className="empty-icon" />
            <h3>No pages found</h3>
            <p>
              {activeTab === 'your-pages'
                ? 'Create your first page to get started'
                : 'Check back later for page suggestions'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pages;
