import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaStar, FaShare } from 'react-icons/fa';
import { formatEventDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './EventDetail.css';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event);

      // Check RSVP status
      if (response.data.event.going?.some(u => u._id === user?.id)) {
        setRsvpStatus('going');
      } else if (response.data.event.interested?.some(u => u._id === user?.id)) {
        setRsvpStatus('interested');
      }
    } catch (err) {
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status) => {
    try {
      await api.post(`/events/${id}/rsvp`, { status });
      setRsvpStatus(status);
      fetchEvent();
    } catch (err) {
      console.error('Error RSVPing:', err);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  if (!event) {
    return <div className="not-found">Event not found</div>;
  }

  return (
    <div className="event-detail">
      <div className="event-hero">
        <img src={event.coverPhoto || '/default-event-cover.jpg'} alt="" />
      </div>

      <div className="event-content">
        <div className="event-main">
          <div className="event-header card">
            <span className="event-date-text">{formatEventDate(event.startDate)}</span>
            <h1>{event.name}</h1>

            <div className="event-meta">
              <div className="meta-item">
                <FaCalendarAlt />
                <span>{formatEventDate(event.startDate)}</span>
              </div>
              {event.location?.venue && (
                <div className="meta-item">
                  <FaMapMarkerAlt />
                  <span>{event.location.venue}</span>
                </div>
              )}
              <div className="meta-item">
                <FaUsers />
                <span>{event.goingCount} going · {event.interestedCount} interested</span>
              </div>
            </div>

            <div className="event-actions">
              <button
                className={`btn ${rsvpStatus === 'going' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleRSVP('going')}
              >
                <FaStar /> {rsvpStatus === 'going' ? 'Going' : 'Going'}
              </button>
              <button
                className={`btn ${rsvpStatus === 'interested' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleRSVP('interested')}
              >
                Interested
              </button>
              <button className="btn btn-secondary">
                <FaShare /> Share
              </button>
            </div>
          </div>

          <div className="event-about card">
            <h2>Details</h2>
            <p>{event.description || 'No description provided.'}</p>
          </div>

          {event.going?.length > 0 && (
            <div className="event-guests card">
              <h2>Guests</h2>
              <div className="guests-tabs">
                <button className="tab active">Going · {event.goingCount}</button>
                <button className="tab">Interested · {event.interestedCount}</button>
              </div>
              <div className="guests-list">
                {event.going.slice(0, 8).map(guest => (
                  <div key={guest._id} className="guest-item">
                    <img src={guest.profilePicture || '/default-avatar.png'} alt="" />
                    <span>{guest.firstName} {guest.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="event-sidebar">
          {event.location && (
            <div className="card">
              <h3>Location</h3>
              <p>{event.location.venue}</p>
              {event.location.address && (
                <p className="location-address">
                  {event.location.address.street}, {event.location.address.city}
                </p>
              )}
              <div className="location-map">
                <FaMapMarkerAlt />
                <span>View on map</span>
              </div>
            </div>
          )}

          {event.hosts?.length > 0 && (
            <div className="card">
              <h3>Hosted by</h3>
              {event.hosts.map(host => (
                <div key={host._id} className="host-item">
                  <img src={host.profilePicture || '/default-avatar.png'} alt="" />
                  <span>{host.firstName} {host.lastName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
