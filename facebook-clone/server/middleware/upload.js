const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';

    if (file.fieldname === 'profilePicture' || file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'coverPhoto') {
      uploadPath += 'covers/';
    } else if (file.fieldname === 'postImages' || file.fieldname === 'images') {
      uploadPath += 'posts/';
    } else if (file.fieldname === 'storyMedia') {
      uploadPath += 'stories/';
    } else if (file.fieldname === 'messageAttachment') {
      uploadPath += 'messages/';
    } else if (file.fieldname === 'marketplaceImages') {
      uploadPath += 'marketplace/';
    } else {
      uploadPath += 'misc/';
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|webm|mov|avi/;
  const allowedAudioTypes = /mp3|wav|ogg/;
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype;

  if (allowedImageTypes.test(extname) && mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (allowedVideoTypes.test(extname) && mimetype.startsWith('video/')) {
    cb(null, true);
  } else if (allowedAudioTypes.test(extname) && mimetype.startsWith('audio/')) {
    cb(null, true);
  } else if (allowedDocTypes.test(extname)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

module.exports = upload;
