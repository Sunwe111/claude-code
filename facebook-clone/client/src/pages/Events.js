import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { formatEventDate } from '../utils/helpers';
import api from '../utils/api';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await api.get('/events/my-events');
      setMyEvents(response.data.events);
    } catch (err) {
      console.error('Error fetching my events:', err);
    }
  };

  const handleRSVP = async (eventId, status, e) => {
    e.preventDefault();
    try {
      await api.post(`/events/${eventId}/rsvp`, { status });
      fetchEvents();
    } catch (err) {
      console.error('Error RSVPing:', err);
    }
  };

  const displayEvents = activeTab === 'your-events' ? myEvents : events;

  return (
    <div className="events-page">
      <div className="events-sidebar card">
        <h1>Events</h1>
        <nav className="events-nav">
          <button
            className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <FaCalendarAlt />
            <span>Discover</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'your-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('your-events')}
          >
            <FaCalendarAlt />
            <span>Your Events</span>
          </button>
        </nav>
        <button className="btn btn-primary btn-full">
          <FaPlus /> Create new event
        </button>
      </div>

      <div className="events-content">
        <h2>{activeTab === 'your-events' ? 'Your Events' : 'Upcoming Events'}</h2>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="events-list">
            {displayEvents.map(event => (
              <Link to={`/events/${event._id}`} key={event._id} className="event-card card">
                <div className="event-date-badge">
                  <span className="month">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="day">{new Date(event.startDate).getDate()}</span>
                </div>
                <img
                  src={event.coverPhoto || '/default-event-cover.jpg'}
                  alt=""
                  className="event-cover"
                />
                <div className="event-info">
                  <span className="event-time">{formatEventDate(event.startDate)}</span>
                  <h3>{event.name}</h3>
                  {event.location?.venue && (
                    <p className="event-location">
                      <FaMapMarkerAlt /> {event.location.venue}
                    </p>
                  )}
                  <p className="event-stats">
                    {event.goingCount} going · {event.interestedCount} interested
                  </p>
                </div>
                {activeTab === 'discover' && (
                  <div className="event-actions">
                    <button
                      className="btn btn-primary"
                      onClick={(e) => handleRSVP(event._id, 'going', e)}
                    >
                      Going
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => handleRSVP(event._id, 'interested', e)}
                    >
                      Interested
                    </button>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {!loading && displayEvents.length === 0 && (
          <div className="empty-state">
            <FaCalendarAlt className="empty-icon" />
            <h3>No events found</h3>
            <p>Check back later for upcoming events</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
