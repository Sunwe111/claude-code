import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  FaSearch, FaEdit, FaEllipsisH, FaPhone, FaVideo, FaInfoCircle,
  FaImage, FaSmile, FaThumbsUp, FaPaperPlane, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { formatMessageTime } from '../utils/helpers';
import api from '../utils/api';
import './Messages.css';

const Messages = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { socket, sendMessage: socketSendMessage, sendTyping, isUserOnline } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else if (searchParams.get('user')) {
      createOrGetConversation(searchParams.get('user'));
    }
  }, [conversationId, searchParams]);

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        if (message.conversation === activeConversation?._id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
        fetchConversations();
      });

      socket.on('userTyping', ({ conversationId: convId, userId, isTyping }) => {
        if (convId === activeConversation?._id) {
          setTyping(isTyping);
        }
      });

      return () => {
        socket.off('newMessage');
        socket.off('userTyping');
      };
    }
  }, [socket, activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      const convResponse = await api.get(`/messages/conversation/${id}`);
      setMessages(convResponse.data.messages);

      const conv = conversations.find(c => c._id === id);
      setActiveConversation(conv);

      // Mark as read
      await api.put(`/messages/conversation/${id}/read`);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const createOrGetConversation = async (userId) => {
    try {
      const response = await api.post('/messages/conversation', {
        participantId: userId
      });
      setActiveConversation(response.data.conversation);
      setMessages([]);
      fetchConversations();
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const response = await api.post('/messages', {
        conversationId: activeConversation._id,
        content: newMessage
      });

      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');

      // Notify via socket
      const recipient = getOtherParticipant();
      if (recipient) {
        socketSendMessage(recipient._id, response.data.message);
      }

      fetchConversations();
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    const recipient = getOtherParticipant();
    if (recipient && activeConversation) {
      sendTyping(recipient._id, activeConversation._id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(recipient._id, activeConversation._id, false);
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = () => {
    if (!activeConversation) return null;
    return activeConversation.participants.find(p => p._id !== user.id);
  };

  const filteredConversations = conversations.filter(conv => {
    const other = conv.participants.find(p => p._id !== user.id);
    const name = `${other?.firstName} ${other?.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="messages-page">
      {/* Conversations List */}
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h1>Chats</h1>
          <div className="sidebar-actions">
            <button className="icon-btn"><FaEllipsisH /></button>
            <button className="icon-btn"><FaEdit /></button>
          </div>
        </div>

        <div className="search-conversations">
          <FaSearch />
          <input
            type="text"
            placeholder="Search Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="conversations-list">
          {filteredConversations.map(conv => {
            const other = conv.participants.find(p => p._id !== user.id);
            const unread = conv.unreadCount?.find(u => u.user === user.id)?.count || 0;

            return (
              <div
                key={conv._id}
                className={`conversation-item ${activeConversation?._id === conv._id ? 'active' : ''} ${unread > 0 ? 'unread' : ''}`}
                onClick={() => loadConversation(conv._id)}
              >
                <div className="conv-avatar">
                  <img src={other?.profilePicture || '/default-avatar.png'} alt="" />
                  {isUserOnline(other?._id) && <span className="online-dot"></span>}
                </div>
                <div className="conv-info">
                  <span className="conv-name">{other?.firstName} {other?.lastName}</span>
                  <span className="conv-preview">
                    {conv.lastMessage?.content?.substring(0, 30)}
                    {conv.lastMessage?.content?.length > 30 ? '...' : ''}
                  </span>
                </div>
                {unread > 0 && <span className="unread-badge">{unread}</span>}
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="no-conversations">
              <p>No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {activeConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-user">
                <img
                  src={getOtherParticipant()?.profilePicture || '/default-avatar.png'}
                  alt=""
                />
                <div>
                  <span className="chat-name">
                    {getOtherParticipant()?.firstName} {getOtherParticipant()?.lastName}
                  </span>
                  <span className="chat-status">
                    {isUserOnline(getOtherParticipant()?._id) ? 'Active now' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="chat-actions">
                <button className="icon-btn"><FaPhone /></button>
                <button className="icon-btn"><FaVideo /></button>
                <button className="icon-btn"><FaInfoCircle /></button>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((message, index) => {
                const isOwn = message.sender._id === user.id || message.sender === user.id;
                const showAvatar = !isOwn && (
                  index === 0 ||
                  messages[index - 1]?.sender._id !== message.sender._id
                );

                return (
                  <div
                    key={message._id}
                    className={`message ${isOwn ? 'own' : 'other'}`}
                  >
                    {!isOwn && showAvatar && (
                      <img
                        src={getOtherParticipant()?.profilePicture || '/default-avatar.png'}
                        alt=""
                        className="message-avatar"
                      />
                    )}
                    {!isOwn && !showAvatar && <div className="avatar-placeholder"></div>}
                    <div className="message-bubble">
                      <p>{message.content}</p>
                    </div>
                    <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                  </div>
                );
              })}
              {typing && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input" onSubmit={sendMessage}>
              <button type="button" className="icon-btn"><FaImage /></button>
              <button type="button" className="icon-btn"><FaSmile /></button>
              <input
                type="text"
                placeholder="Aa"
                value={newMessage}
                onChange={handleTyping}
              />
              {newMessage.trim() ? (
                <button type="submit" className="send-btn">
                  <FaPaperPlane />
                </button>
              ) : (
                <button type="button" className="icon-btn">
                  <FaThumbsUp />
                </button>
              )}
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h2>Select a conversation</h2>
            <p>Choose a friend from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
