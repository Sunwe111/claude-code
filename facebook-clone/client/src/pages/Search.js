import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaSearch, FaUser, FaUsers, FaFlag, FaCalendarAlt, FaStore, FaNewspaper, FaImage, FaVideo } from 'react-icons/fa';
import { formatPrice, timeAgo } from '../utils/helpers';
import api from '../utils/api';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState({
    users: [],
    posts: [],
    groups: [],
    pages: [],
    events: [],
    marketplace: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', icon: FaSearch },
    { id: 'people', label: 'People', icon: FaUser },
    { id: 'posts', label: 'Posts', icon: FaNewspaper },
    { id: 'photos', label: 'Photos', icon: FaImage },
    { id: 'videos', label: 'Videos', icon: FaVideo },
    { id: 'marketplace', label: 'Marketplace', icon: FaStore },
    { id: 'pages', label: 'Pages', icon: FaFlag },
    { id: 'groups', label: 'Groups', icon: FaUsers },
    { id: 'events', label: 'Events', icon: FaCalendarAlt }
  ];

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return (
    <div className="search-page">
      <div className="search-sidebar card">
        <h2>Search Results</h2>
        <nav className="search-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="search-content">
        {!query && (
          <div className="empty-state">
            <FaSearch className="empty-icon" />
            <h3>Search Facebook</h3>
            <p>Enter a search term to find people, posts, and more</p>
          </div>
        )}

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        )}

        {query && !loading && !hasResults && (
          <div className="empty-state">
            <FaSearch className="empty-icon" />
            <h3>No results found</h3>
            <p>We couldn't find anything for "{query}"</p>
          </div>
        )}

        {!loading && hasResults && (
          <>
            {(activeTab === 'all' || activeTab === 'people') && results.users?.length > 0 && (
              <div className="results-section card">
                <h3>People</h3>
                <div className="people-results">
                  {results.users.slice(0, activeTab === 'all' ? 5 : undefined).map(user => (
                    <Link to={`/profile/${user._id}`} key={user._id} className="person-result">
                      <img
                        src={user.profilePicture || '/default-avatar.png'}
                        alt=""
                        className="person-avatar"
                      />
                      <div className="person-info">
                        <span className="person-name">{user.firstName} {user.lastName}</span>
                        {user.mutualFriends > 0 && (
                          <span className="mutual-friends">{user.mutualFriends} mutual friends</span>
                        )}
                      </div>
                      <button className="btn btn-secondary">Add Friend</button>
                    </Link>
                  ))}
                </div>
                {activeTab === 'all' && results.users.length > 5 && (
                  <button className="see-all-btn" onClick={() => setActiveTab('people')}>
                    See all people results
                  </button>
                )}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
              <div className="results-section card">
                <h3>Posts</h3>
                <div className="posts-results">
                  {results.posts.slice(0, activeTab === 'all' ? 3 : undefined).map(post => (
                    <Link to={`/post/${post._id}`} key={post._id} className="post-result">
                      <div className="post-author">
                        <img
                          src={post.author?.profilePicture || '/default-avatar.png'}
                          alt=""
                        />
                        <div>
                          <span className="author-name">{post.author?.firstName} {post.author?.lastName}</span>
                          <span className="post-time">{timeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                      <p className="post-preview">{post.content?.slice(0, 200)}...</p>
                      {post.images?.[0] && (
                        <img src={post.images[0].url} alt="" className="post-image-preview" />
                      )}
                    </Link>
                  ))}
                </div>
                {activeTab === 'all' && results.posts.length > 3 && (
                  <button className="see-all-btn" onClick={() => setActiveTab('posts')}>
                    See all post results
                  </button>
                )}
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'groups') && results.groups?.length > 0 && (
              <div className="results-section card">
                <h3>Groups</h3>
                <div className="groups-results">
                  {results.groups.slice(0, activeTab === 'all' ? 3 : undefined).map(group => (
                    <Link to={`/groups/${group._id}`} key={group._id} className="group-result">
                      <img
                        src={group.coverPhoto || '/default-group.jpg'}
                        alt=""
                        className="group-cover"
                      />
                      <div className="group-info">
                        <span className="group-name">{group.name}</span>
                        <span className="group-meta">
                          {group.privacy} · {group.members?.length} members
                        </span>
                      </div>
                      <button className="btn btn-primary">Join</button>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'pages') && results.pages?.length > 0 && (
              <div className="results-section card">
                <h3>Pages</h3>
                <div className="pages-results">
                  {results.pages.slice(0, activeTab === 'all' ? 3 : undefined).map(page => (
                    <Link to={`/pages/${page._id}`} key={page._id} className="page-result">
                      <img
                        src={page.profilePicture || '/default-page.jpg'}
                        alt=""
                        className="page-avatar"
                      />
                      <div className="page-info">
                        <span className="page-name">{page.name}</span>
                        <span className="page-meta">
                          {page.category} · {page.followers?.length} followers
                        </span>
                      </div>
                      <button className="btn btn-primary">Follow</button>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'events') && results.events?.length > 0 && (
              <div className="results-section card">
                <h3>Events</h3>
                <div className="events-results">
                  {results.events.slice(0, activeTab === 'all' ? 3 : undefined).map(event => (
                    <Link to={`/events/${event._id}`} key={event._id} className="event-result">
                      <div className="event-date">
                        <span className="month">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="day">{new Date(event.startDate).getDate()}</span>
                      </div>
                      <div className="event-info">
                        <span className="event-name">{event.name}</span>
                        <span className="event-meta">
                          {new Date(event.startDate).toLocaleDateString()} · {event.location?.name}
                        </span>
                        <span className="event-interested">{event.interested?.length} interested</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'marketplace') && results.marketplace?.length > 0 && (
              <div className="results-section card">
                <h3>Marketplace</h3>
                <div className="marketplace-results">
                  {results.marketplace.slice(0, activeTab === 'all' ? 4 : undefined).map(listing => (
                    <Link to={`/marketplace/${listing._id}`} key={listing._id} className="listing-result">
                      <img
                        src={listing.images?.[0]?.url || '/default-product.jpg'}
                        alt=""
                        className="listing-image"
                      />
                      <div className="listing-info">
                        <span className="listing-price">
                          {listing.price?.isFree ? 'Free' : formatPrice(listing.price?.amount)}
                        </span>
                        <span className="listing-title">{listing.title}</span>
                        <span className="listing-location">{listing.location?.city}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
