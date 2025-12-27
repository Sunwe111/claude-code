import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaThumbsUp, FaComment, FaShare, FaEllipsisH, FaGlobeAmericas,
  FaUserFriends, FaLock, FaBookmark, FaEdit, FaTrash, FaTimes,
  FaHeart, FaLaughSquint, FaSurprise, FaSadTear, FaAngry
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { timeAgo, getReactionEmoji } from '../../utils/helpers';
import Comments from './Comments';
import api from '../../utils/api';
import './Post.css';

const Post = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(like => like.user === user?.id || like.user?._id === user?.id)
  );
  const [likeType, setLikeType] = useState(
    post.likes?.find(like => like.user === user?.id || like.user?._id === user?.id)?.type || 'like'
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);

  const reactions = [
    { type: 'like', icon: '👍', label: 'Like' },
    { type: 'love', icon: '❤️', label: 'Love' },
    { type: 'haha', icon: '😂', label: 'Haha' },
    { type: 'wow', icon: '😮', label: 'Wow' },
    { type: 'sad', icon: '😢', label: 'Sad' },
    { type: 'angry', icon: '😡', label: 'Angry' }
  ];

  const handleReaction = async (type) => {
    try {
      const response = await api.post(`/posts/${post._id}/like`, { type });

      if (isLiked && likeType === type) {
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        if (!isLiked) {
          setLikesCount(prev => prev + 1);
        }
        setIsLiked(true);
        setLikeType(type);
      }

      setShowReactions(false);
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  const handleShare = async () => {
    try {
      await api.post(`/posts/${post._id}/share`, {
        content: shareContent,
        visibility: 'friends'
      });
      setShowShareModal(false);
      setShareContent('');
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        onDelete(post._id);
      } catch (err) {
        console.error('Error deleting post:', err);
      }
    }
    setShowMenu(false);
  };

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public': return <FaGlobeAmericas />;
      case 'friends': return <FaUserFriends />;
      case 'only-me': return <FaLock />;
      default: return <FaGlobeAmericas />;
    }
  };

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    return (
      <div className={`post-images grid-${Math.min(post.images.length, 4)}`}>
        {post.images.slice(0, 4).map((image, index) => (
          <div key={index} className="post-image">
            <img src={image.url} alt="" />
            {post.images.length > 4 && index === 3 && (
              <div className="more-images">+{post.images.length - 4}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <article className="post card">
      {/* Post Header */}
      <div className="post-header">
        <Link to={`/profile/${post.author._id}`} className="post-author">
          <img
            src={post.author.profilePicture || '/default-avatar.png'}
            alt=""
            className="avatar avatar-md"
          />
          <div className="author-info">
            <span className="author-name">{post.author.firstName} {post.author.lastName}</span>
            <div className="post-meta">
              <span className="post-time">{timeAgo(post.createdAt)}</span>
              <span className="dot">·</span>
              <span className="visibility-icon">{getVisibilityIcon()}</span>
              {post.isEdited && <span className="edited-label">· Edited</span>}
            </div>
          </div>
        </Link>

        <div className="post-actions-menu">
          <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
            <FaEllipsisH />
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <button className="dropdown-item">
                <FaBookmark />
                <span>Save post</span>
              </button>
              {post.author._id === user?.id && (
                <>
                  <button className="dropdown-item">
                    <FaEdit />
                    <span>Edit post</span>
                  </button>
                  <button className="dropdown-item danger" onClick={handleDelete}>
                    <FaTrash />
                    <span>Delete post</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="post-content">
        {post.feeling && (
          <span className="feeling">
            — feeling {post.feeling.emoji} {post.feeling.text}
          </span>
        )}
        <p className="post-text">{post.content}</p>
      </div>

      {/* Post Images */}
      {renderImages()}

      {/* Shared Post */}
      {post.isShared && post.originalPost && (
        <div className="shared-post">
          <div className="shared-header">
            <Link to={`/profile/${post.originalPost.author._id}`}>
              <img
                src={post.originalPost.author.profilePicture || '/default-avatar.png'}
                alt=""
                className="avatar avatar-sm"
              />
            </Link>
            <div>
              <Link to={`/profile/${post.originalPost.author._id}`} className="shared-author">
                {post.originalPost.author.firstName} {post.originalPost.author.lastName}
              </Link>
              <span className="shared-time">{timeAgo(post.originalPost.createdAt)}</span>
            </div>
          </div>
          <p className="shared-content">{post.originalPost.content}</p>
        </div>
      )}

      {/* Post Stats */}
      {(likesCount > 0 || commentsCount > 0 || post.shares?.length > 0) && (
        <div className="post-stats">
          {likesCount > 0 && (
            <div className="likes-count">
              <span className="reaction-icons">
                {reactions.slice(0, 3).map(r => (
                  <span key={r.type} className="reaction-icon">{r.icon}</span>
                ))}
              </span>
              <span>{likesCount}</span>
            </div>
          )}
          <div className="stats-right">
            {commentsCount > 0 && (
              <button onClick={() => setShowComments(!showComments)}>
                {commentsCount} comments
              </button>
            )}
            {post.shares?.length > 0 && (
              <span>{post.shares.length} shares</span>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="post-actions">
        <div
          className="action-wrapper"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            className={`post-action ${isLiked ? 'liked' : ''}`}
            onClick={() => handleReaction('like')}
          >
            {isLiked ? (
              <span className="reaction-emoji">{getReactionEmoji(likeType)}</span>
            ) : (
              <FaThumbsUp />
            )}
            <span>{isLiked ? likeType.charAt(0).toUpperCase() + likeType.slice(1) : 'Like'}</span>
          </button>

          {showReactions && (
            <div className="reactions-popup">
              {reactions.map(reaction => (
                <button
                  key={reaction.type}
                  className="reaction-btn"
                  onClick={() => handleReaction(reaction.type)}
                  title={reaction.label}
                >
                  {reaction.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="post-action"
          onClick={() => setShowComments(!showComments)}
        >
          <FaComment />
          <span>Comment</span>
        </button>

        <button
          className="post-action"
          onClick={() => setShowShareModal(true)}
        >
          <FaShare />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <Comments
          postId={post._id}
          onCommentAdd={() => setCommentsCount(prev => prev + 1)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal share-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Share Post</h2>
              <button className="close-btn" onClick={() => setShowShareModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <textarea
                placeholder="Say something about this..."
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                rows={3}
              />
              <div className="shared-preview">
                <div className="shared-header">
                  <img
                    src={post.author.profilePicture || '/default-avatar.png'}
                    alt=""
                    className="avatar avatar-sm"
                  />
                  <div>
                    <span className="shared-author">
                      {post.author.firstName} {post.author.lastName}
                    </span>
                  </div>
                </div>
                <p className="shared-content">{post.content}</p>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleShare}>
                Share now
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default Post;
