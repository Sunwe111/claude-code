import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStore, FaPlus, FaSearch, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { formatPrice } from '../utils/helpers';
import api from '../utils/api';
import './Marketplace.css';

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchListings();
    fetchCategories();
  }, [activeCategory]);

  const fetchListings = async () => {
    try {
      let url = '/marketplace';
      if (activeCategory) {
        url += `?category=${activeCategory}`;
      }
      const response = await api.get(url);
      setListings(response.data.listings);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/marketplace/categories');
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSave = async (listingId, e) => {
    e.preventDefault();
    try {
      await api.post(`/marketplace/${listingId}/save`);
      fetchListings();
    } catch (err) {
      console.error('Error saving listing:', err);
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="marketplace-page">
      <div className="marketplace-sidebar card">
        <h1>Marketplace</h1>

        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search Marketplace"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="marketplace-nav">
          <button
            className={`nav-item ${!activeCategory ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            <FaStore />
            <span>Browse all</span>
          </button>
          {categories.slice(0, 8).map(cat => (
            <button
              key={cat.id}
              className={`nav-item ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="cat-count">{cat.count}</span>
            </button>
          ))}
        </nav>

        <button className="btn btn-primary btn-full">
          <FaPlus /> Create new listing
        </button>
      </div>

      <div className="marketplace-content">
        <h2>{activeCategory ? categories.find(c => c.id === activeCategory)?.name : "Today's picks"}</h2>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="listings-grid">
            {filteredListings.map(listing => (
              <Link
                to={`/marketplace/${listing._id}`}
                key={listing._id}
                className="listing-card"
              >
                <div className="listing-image">
                  <img
                    src={listing.images?.[0]?.url || '/default-product.jpg'}
                    alt=""
                  />
                  <button
                    className="save-btn"
                    onClick={(e) => handleSave(listing._id, e)}
                  >
                    <FaHeart />
                  </button>
                </div>
                <div className="listing-info">
                  <span className="listing-price">
                    {listing.price?.isFree ? 'Free' : formatPrice(listing.price?.amount)}
                  </span>
                  <h3>{listing.title}</h3>
                  {listing.location?.city && (
                    <p className="listing-location">
                      <FaMapMarkerAlt /> {listing.location.city}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredListings.length === 0 && (
          <div className="empty-state">
            <FaStore className="empty-icon" />
            <h3>No listings found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
