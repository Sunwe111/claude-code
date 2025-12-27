import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

// Format relative time (e.g., "2 hours ago")
export const timeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Format message time
export const formatMessageTime = (date) => {
  const d = new Date(date);
  if (isToday(d)) {
    return format(d, 'h:mm a');
  }
  if (isYesterday(d)) {
    return 'Yesterday ' + format(d, 'h:mm a');
  }
  if (isThisWeek(d)) {
    return format(d, 'EEEE h:mm a');
  }
  if (isThisYear(d)) {
    return format(d, 'MMM d, h:mm a');
  }
  return format(d, 'MMM d, yyyy h:mm a');
};

// Format date for events
export const formatEventDate = (date) => {
  const d = new Date(date);
  if (isToday(d)) {
    return 'Today at ' + format(d, 'h:mm a');
  }
  if (isThisWeek(d)) {
    return format(d, 'EEEE') + ' at ' + format(d, 'h:mm a');
  }
  return format(d, 'EEE, MMM d') + ' at ' + format(d, 'h:mm a');
};

// Format number (e.g., 1.2K, 1.5M)
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

// Format price
export const formatPrice = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Get initials from name
export const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

// Check if file is image
export const isImage = (filename) => {
  const ext = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

// Check if file is video
export const isVideo = (filename) => {
  const ext = getFileExtension(filename).toLowerCase();
  return ['mp4', 'webm', 'mov', 'avi'].includes(ext);
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate random color for avatar
export const getAvatarColor = (name) => {
  const colors = [
    '#1877f2', '#42b72a', '#f02849', '#a033ff',
    '#ff6d00', '#00b2ff', '#00c000', '#ff3b5c'
  ];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Parse hashtags from text
export const parseHashtags = (text) => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(tag => tag.slice(1)) : [];
};

// Parse mentions from text
export const parseMentions = (text) => {
  const regex = /@(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(mention => mention.slice(1)) : [];
};

// Get reaction emoji
export const getReactionEmoji = (type) => {
  const reactions = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡'
  };
  return reactions[type] || '👍';
};

// Check if URL is valid
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Linkify text (convert URLs to links)
export const linkifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
};

// Get privacy icon
export const getPrivacyIcon = (privacy) => {
  switch (privacy) {
    case 'public':
      return '🌐';
    case 'friends':
      return '👥';
    case 'only-me':
      return '🔒';
    default:
      return '🌐';
  }
};

// Calculate mutual friends
export const getMutualFriendsText = (count) => {
  if (count === 0) return '';
  if (count === 1) return '1 mutual friend';
  return `${count} mutual friends`;
};
