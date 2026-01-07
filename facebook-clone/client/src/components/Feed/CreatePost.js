import React, { useState, useRef } from 'react';
import { FaImages, FaUserTag, FaSmile, FaMapMarkerAlt, FaTimes, FaGlobeAmericas, FaUserFriends, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './CreatePost.css';

const CreatePost = ({ onPost }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [visibility, setVisibility] = useState('friends');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && images.length === 0) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('visibility', visibility);
      images.forEach(image => {
        formData.append('images', image);
      });

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onPost(response.data.post);
      resetForm();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setImages([]);
    setPreviews([]);
    setShowModal(false);
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return <FaGlobeAmericas />;
      case 'friends': return <FaUserFriends />;
      case 'only-me': return <FaLock />;
      default: return <FaUserFriends />;
    }
  };

  return (
    <>
      {/* Quick Create Bar */}
      <div className="create-post-bar card">
        <img
          src={user?.profilePicture || '/default-avatar.png'}
          alt=""
          className="avatar avatar-md"
        />
        <button
          className="create-input"
          onClick={() => setShowModal(true)}
        >
          What's on your mind, {user?.firstName}?
        </button>
      </div>

      <div className="create-post-actions card">
        <button className="action-btn" onClick={() => { setShowModal(true); }}>
          <FaImages className="icon-red" />
          <span>Photo/Video</span>
        </button>
        <button className="action-btn" onClick={() => setShowModal(true)}>
          <FaUserTag className="icon-blue" />
          <span>Tag Friends</span>
        </button>
        <button className="action-btn" onClick={() => setShowModal(true)}>
          <FaSmile className="icon-yellow" />
          <span>Feeling/Activity</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal create-post-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create post</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="post-author">
                <img
                  src={user?.profilePicture || '/default-avatar.png'}
                  alt=""
                  className="avatar avatar-md"
                />
                <div>
                  <span className="author-name">{user?.firstName} {user?.lastName}</span>
                  <button className="visibility-btn">
                    {getVisibilityIcon()}
                    <span>{visibility}</span>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      <option value="public">Public</option>
                      <option value="friends">Friends</option>
                      <option value="only-me">Only me</option>
                    </select>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <textarea
                  placeholder={`What's on your mind, ${user?.firstName}?`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="post-textarea"
                  rows={previews.length > 0 ? 3 : 5}
                />

                {previews.length > 0 && (
                  <div className={`image-previews grid-${Math.min(previews.length, 4)}`}>
                    {previews.map((preview, index) => (
                      <div key={index} className="preview-item">
                        <img src={preview} alt="" />
                        <button
                          type="button"
                          className="remove-preview"
                          onClick={() => removeImage(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="add-to-post">
                  <span>Add to your post</span>
                  <div className="add-actions">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="add-btn"
                      title="Photo/Video"
                    >
                      <FaImages className="icon-green" />
                    </button>
                    <button type="button" className="add-btn" title="Tag People">
                      <FaUserTag className="icon-blue" />
                    </button>
                    <button type="button" className="add-btn" title="Feeling/Activity">
                      <FaSmile className="icon-yellow" />
                    </button>
                    <button type="button" className="add-btn" title="Check In">
                      <FaMapMarkerAlt className="icon-red" />
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  multiple
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                />

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || (!content.trim() && images.length === 0)}
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatePost;
