import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        withCredentials: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('join', user.id);
      });

      newSocket.on('userOnline', (userId) => {
        setOnlineUsers(prev => [...new Set([...prev, userId])]);
      });

      newSocket.on('userOffline', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendMessage = (recipientId, message) => {
    if (socket) {
      socket.emit('sendMessage', { recipientId, message });
    }
  };

  const sendTyping = (recipientId, conversationId, isTyping) => {
    if (socket) {
      socket.emit('typing', { recipientId, conversationId, isTyping });
    }
  };

  const sendNotification = (recipientId, notification) => {
    if (socket) {
      socket.emit('sendNotification', { recipientId, notification });
    }
  };

  const markMessageRead = (senderId, conversationId) => {
    if (socket) {
      socket.emit('messageRead', { senderId, conversationId });
    }
  };

  const storyViewed = (authorId, storyId) => {
    if (socket && user) {
      socket.emit('storyViewed', { authorId, storyId, viewerId: user.id });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const value = {
    socket,
    onlineUsers,
    sendMessage,
    sendTyping,
    sendNotification,
    markMessageRead,
    storyViewed,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
