import React, { useState, useEffect } from 'react';
import { FaPlus, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import './Stories.css';

const Stories = () => {
  const { user } = useAuth();
  const { storyViewed } = useSocket();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStory, setActiveStory] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (activeStory) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [activeStory, activeIndex]);

  const fetchStories = async () => {
    try {
      const response = await api.get('/stories/feed');
      setStories(response.data.stories);
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const openStory = async (storyGroup, index = 0) => {
    setActiveStory(storyGroup);
    setActiveIndex(index);
    setProgress(0);

    // Mark as viewed
    if (storyGroup.stories[index]) {
      try {
        await api.post(`/stories/${storyGroup.stories[index]._id}/view`);
        storyViewed(storyGroup.author._id, storyGroup.stories[index]._id);
      } catch (err) {
        console.error('Error marking story as viewed:', err);
      }
    }
  };

  const closeStory = () => {
    setActiveStory(null);
    setActiveIndex(0);
    setProgress(0);
  };

  const nextStory = async () => {
    if (activeStory) {
      if (activeIndex < activeStory.stories.length - 1) {
        const newIndex = activeIndex + 1;
        setActiveIndex(newIndex);
        setProgress(0);

        try {
          await api.post(`/stories/${activeStory.stories[newIndex]._id}/view`);
        } catch (err) {
          console.error('Error marking story as viewed:', err);
        }
      } else {
        // Move to next user's story
        const currentUserIndex = stories.findIndex(s => s._id === activeStory._id);
        if (currentUserIndex < stories.length - 1) {
          openStory(stories[currentUserIndex + 1], 0);
        } else {
          closeStory();
        }
      }
    }
  };

  const prevStory = () => {
    if (activeStory) {
      if (activeIndex > 0) {
        setActiveIndex(prev => prev - 1);
        setProgress(0);
      } else {
        // Move to previous user's story
        const currentUserIndex = stories.findIndex(s => s._id === activeStory._id);
        if (currentUserIndex > 0) {
          const prevUserStories = stories[currentUserIndex - 1];
          openStory(prevUserStories, prevUserStories.stories.length - 1);
        }
      }
    }
  };

  return (
    <>
      <div className="stories-container card">
        <div className="stories-scroll">
          {/* Create Story */}
          <div className="story-card create-story">
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt=""
              className="create-story-bg"
            />
            <div className="create-story-content">
              <div className="create-story-btn">
                <FaPlus />
              </div>
              <span>Create story</span>
            </div>
          </div>

          {/* Story Cards */}
          {stories.map((storyGroup) => (
            <div
              key={storyGroup._id}
              className={`story-card ${storyGroup.hasUnviewed ? 'unviewed' : ''}`}
              onClick={() => openStory(storyGroup)}
            >
              <img
                src={storyGroup.stories[0]?.media?.url || storyGroup.author.profilePicture || '/default-avatar.png'}
                alt=""
                className="story-bg"
              />
              <div className="story-overlay"></div>
              <div className="story-author-avatar">
                <img
                  src={storyGroup.author.profilePicture || '/default-avatar.png'}
                  alt=""
                />
              </div>
              <span className="story-author-name">
                {storyGroup.author.firstName} {storyGroup.author.lastName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStory && (
        <div className="story-viewer" onClick={closeStory}>
          <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
            <div className="story-progress-bars">
              {activeStory.stories.map((_, idx) => (
                <div key={idx} className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: idx === activeIndex ? `${progress}%` :
                             idx < activeIndex ? '100%' : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="story-header">
              <div className="story-user">
                <img
                  src={activeStory.author.profilePicture || '/default-avatar.png'}
                  alt=""
                />
                <span>{activeStory.author.firstName} {activeStory.author.lastName}</span>
              </div>
              <button className="close-story" onClick={closeStory}>
                <FaTimes />
              </button>
            </div>

            <div className="story-media">
              {activeStory.stories[activeIndex]?.type === 'text' ? (
                <div
                  className="story-text"
                  style={{ backgroundColor: activeStory.stories[activeIndex]?.text?.backgroundColor || '#1877f2' }}
                >
                  <p>{activeStory.stories[activeIndex]?.text?.content}</p>
                </div>
              ) : (
                <img
                  src={activeStory.stories[activeIndex]?.media?.url}
                  alt=""
                />
              )}
            </div>

            <button className="story-nav prev" onClick={prevStory}>
              <FaChevronLeft />
            </button>
            <button className="story-nav next" onClick={nextStory}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Stories;
