const express = require('express');
const protect = require('../middleware/auth');
const {
  getNotes,
  getTags,
  getNote,
  createNote,
  updateNote,
  togglePin,
  deleteNote,
} = require('../controllers/noteController');

const router = express.Router();

// Every notes route requires a logged-in user
router.use(protect);

router.route('/').get(getNotes).post(createNote);
router.get('/tags', getTags);
router.route('/:id').get(getNote).put(updateNote).delete(deleteNote);
router.patch('/:id/pin', togglePin);

module.exports = router;
