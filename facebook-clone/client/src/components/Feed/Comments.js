import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCamera, FaSmile, FaThumbsUp, FaReply } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/helpers';
import api from '../../utils/api';
import './Comments.css';

const Comments = ({ postId, onCommentAdd }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      setComments(response.data.comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content: newComment
      });
      setComments(prev => [response.data.comment, ...prev]);
      setNewComment('');
      onCommentAdd();
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (commentId) => {
    if (!replyContent.trim()) return;

    try {
      const response = await api.post(`/comments/${commentId}/reply`, {
        content: replyContent
      });

      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), response.data.reply]
          };
        }
        return comment;
      }));

      setReplyingTo(null);
      setReplyContent('');
    } catch (err) {
      console.error('Error adding reply:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await api.post(`/comments/${commentId}/like`);

      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, likes: response.data.likes };
        }
        return comment;
      }));
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const Comment = ({ comment, isReply = false }) => {
    const isLiked = comment.likes?.some(
      like => like.user === user?.id || like.user?._id === user?.id
    );

    return (
      <div className={`comment ${isReply ? 'reply' : ''}`}>
        <Link to={`/profile/${comment.author._id}`}>
          <img
            src={comment.author.profilePicture || '/default-avatar.png'}
            alt=""
            className={`avatar ${isReply ? 'avatar-xs' : 'avatar-sm'}`}
          />
        </Link>
        <div className="comment-body">
          <div className="comment-bubble">
            <Link to={`/profile/${comment.author._id}`} className="comment-author">
              {comment.author.firstName} {comment.author.lastName}
            </Link>
            <p className="comment-text">{comment.content}</p>
            {comment.image && (
              <img src={comment.image} alt="" className="comment-image" />
            )}
          </div>

          <div className="comment-actions">
            <button
              className={`comment-action ${isLiked ? 'liked' : ''}`}
              onClick={() => handleLikeComment(comment._id)}
            >
              Like
            </button>
            {!isReply && (
              <button
                className="comment-action"
                onClick={() => setReplyingTo(comment._id)}
              >
                Reply
              </button>
            )}
            <span className="comment-time">{timeAgo(comment.createdAt)}</span>
            {comment.likes?.length > 0 && (
              <span className="comment-likes">
                <FaThumbsUp /> {comment.likes.length}
              </span>
            )}
          </div>

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="replies">
              {comment.replies.map(reply => (
                <Comment key={reply._id} comment={reply} isReply />
              ))}
            </div>
          )}

          {/* Reply Input */}
          {replyingTo === comment._id && (
            <div className="reply-input">
              <img
                src={user?.profilePicture || '/default-avatar.png'}
                alt=""
                className="avatar avatar-xs"
              />
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder={`Reply to ${comment.author.firstName}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply(comment._id)}
                  autoFocus
                />
                <div className="input-actions">
                  <button><FaSmile /></button>
                  <button><FaCamera /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="comments-section">
      {/* Comment Input */}
      <form className="comment-form" onSubmit={handleSubmitComment}>
        <img
          src={user?.profilePicture || '/default-avatar.png'}
          alt=""
          className="avatar avatar-sm"
        />
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
          />
          <div className="input-actions">
            <button type="button"><FaSmile /></button>
            <button type="button"><FaCamera /></button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {comments.map(comment => (
          <Comment key={comment._id} comment={comment} />
        ))}
      </div>
    </div>
  );
};

export default Comments;
