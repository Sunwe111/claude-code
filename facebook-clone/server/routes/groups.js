const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  updateGroupCover,
  joinGroup,
  leaveGroup,
  approveMember,
  inviteUser,
  getGroupPosts,
  createGroupPost,
  getMyGroups,
  removeMember,
  deleteGroup
} = require('../controllers/groupController');

router.post('/', protect, createGroup);
router.get('/', protect, getGroups);
router.get('/my-groups', protect, getMyGroups);
router.get('/:id', protect, getGroup);
router.put('/:id', protect, updateGroup);
router.put('/:id/cover', protect, upload.single('coverPhoto'), updateGroupCover);
router.post('/:id/join', protect, joinGroup);
router.delete('/:id/leave', protect, leaveGroup);
router.post('/:id/members/:userId/approve', protect, approveMember);
router.post('/:id/invite/:userId', protect, inviteUser);
router.delete('/:id/members/:userId', protect, removeMember);
router.get('/:id/posts', protect, getGroupPosts);
router.post('/:id/posts', protect, upload.array('images', 10), createGroupPost);
router.delete('/:id', protect, deleteGroup);

module.exports = router;
