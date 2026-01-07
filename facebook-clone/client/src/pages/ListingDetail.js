import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaHeart, FaShare, FaFacebookMessenger, FaMapMarkerAlt, FaUser, FaCalendarAlt } from 'react-icons/fa';
import { formatPrice, timeAgo } from '../utils/helpers';
import api from '../utils/api';
import './ListingDetail.css';

const ListingDetail = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/marketplace/${id}`);
      setListing(response.data.listing);
    } catch (err) {
      console.error('Error fetching listing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.post(`/marketplace/${id}/save`);
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Error saving listing:', err);
    }
  };

  const handleContact = async () => {
    try {
      await api.post(`/marketplace/${id}/contact`, {
        message: `Hi, I'm interested in "${listing.title}"`
      });
      // Navigate to messages
    } catch (err) {
      console.error('Error contacting seller:', err);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  if (!listing) {
    return <div className="not-found">Listing not found</div>;
  }

  return (
    <div className="listing-detail">
      <div className="listing-gallery">
        <div className="main-image">
          <img
            src={listing.images?.[activeImage]?.url || '/default-product.jpg'}
            alt=""
          />
        </div>
        {listing.images?.length > 1 && (
          <div className="thumbnail-strip">
            {listing.images.map((img, idx) => (
              <button
                key={idx}
                className={`thumbnail ${idx === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(idx)}
              >
                <img src={img.url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="listing-content">
        <div className="listing-main card">
          <div className="listing-header">
            <h1>{listing.title}</h1>
            <span className="listing-price">
              {listing.price?.isFree ? 'Free' : formatPrice(listing.price?.amount)}
            </span>
          </div>

          <div className="listing-meta">
            <span className="condition">{listing.condition}</span>
            {listing.location?.city && (
              <span className="location">
                <FaMapMarkerAlt /> {listing.location.city}
              </span>
            )}
            <span className="posted">
              <FaCalendarAlt /> Listed {timeAgo(listing.createdAt)}
            </span>
          </div>

          <div className="listing-actions">
            <button className="btn btn-primary btn-full" onClick={handleContact}>
              <FaFacebookMessenger /> Message Seller
            </button>
            <button
              className={`btn btn-secondary ${isSaved ? 'saved' : ''}`}
              onClick={handleSave}
            >
              <FaHeart /> {isSaved ? 'Saved' : 'Save'}
            </button>
            <button className="btn btn-secondary">
              <FaShare /> Share
            </button>
          </div>

          <div className="listing-description">
            <h2>Description</h2>
            <p>{listing.description || 'No description provided.'}</p>
          </div>

          {listing.tags?.length > 0 && (
            <div className="listing-tags">
              {listing.tags.map((tag, idx) => (
                <span key={idx} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="seller-info card">
          <h2>Seller Information</h2>
          <Link to={`/profile/${listing.seller?._id}`} className="seller-profile">
            <img
              src={listing.seller?.profilePicture || '/default-avatar.png'}
              alt=""
            />
            <div>
              <span className="seller-name">
                {listing.seller?.firstName} {listing.seller?.lastName}
              </span>
              <span className="seller-joined">
                Joined {new Date(listing.seller?.createdAt).getFullYear()}
              </span>
            </div>
          </Link>

          <div className="seller-stats">
            <div className="stat">
              <FaUser />
              <span>View Profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
