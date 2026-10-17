const mongoose = require('mongoose');
const Note = require('../models/Note');

// Escape special characters so the user's search text is treated literally in the regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accept tags as an array or a comma separated string: "work, ideas"
function parseTags(tags) {
  if (tags === undefined) return undefined;
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return tags.split(',');
  return [];
}

// GET /api/notes?search=text&tag=work&pinned=true
async function getNotes(req, res, next) {
  try {
    const { search, tag, pinned } = req.query;
    const filter = { user: req.user._id }; // only this user's notes

    if (typeof search === 'string' && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }
    if (typeof tag === 'string' && tag.trim()) {
      filter.tags = tag.trim().toLowerCase();
    }
    if (pinned === 'true' || pinned === 'false') {
      filter.pinned = pinned === 'true';
    }

    // Pinned notes first, then most recently updated
    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
}

// GET /api/notes/tags - each tag this user has used, with how many notes use it.
// Uses a MongoDB aggregation pipeline: filter -> split the tags array -> group and count -> sort
async function getTags(req, res, next) {
  try {
    const tags = await Note.aggregate([
      { $match: { user: req.user._id } }, // only this user's notes
      { $unwind: '$tags' }, // one document per tag
      { $group: { _id: '$tags', count: { $sum: 1 } } }, // count notes per tag
      { $sort: { count: -1, _id: 1 } }, // most used first, then A-Z
      { $project: { _id: 0, tag: '$_id', count: 1 } }, // rename _id -> tag
    ]);
    res.json(tags);
  } catch (err) {
    next(err);
  }
}

// GET /api/notes/:id
async function getNote(req, res, next) {
  try {
    const note = await findOwnNote(req, res);
    if (note) res.json(note);
  } catch (err) {
    next(err);
  }
}

// POST /api/notes
async function createNote(req, res, next) {
  try {
    const { title, content, tags, pinned } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      tags: parseTags(tags) || [],
      pinned: Boolean(pinned),
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

// PUT /api/notes/:id
async function updateNote(req, res, next) {
  try {
    const note = await findOwnNote(req, res);
    if (!note) return;

    const { title, content, tags, pinned } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = parseTags(tags);
    if (pinned !== undefined) note.pinned = Boolean(pinned);

    const updated = await note.save(); // runs schema validation and refreshes updatedAt
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notes/:id/pin - toggle pinned status
async function togglePin(req, res, next) {
  try {
    const note = await findOwnNote(req, res);
    if (!note) return;
    note.pinned = !note.pinned;
    res.json(await note.save());
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notes/:id
async function deleteNote(req, res, next) {
  try {
    const note = await findOwnNote(req, res);
    if (!note) return;
    await note.deleteOne();
    res.json({ message: 'Note deleted', id: note._id });
  } catch (err) {
    next(err);
  }
}

// Finds a note by id that belongs to the logged-in user; sends 400/404 otherwise.
// Another user's note returns 404, so users cannot even tell it exists.
async function findOwnNote(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: 'Invalid note id' });
    return null;
  }
  const note = await Note.findOne({ _id: id, user: req.user._id });
  if (!note) {
    res.status(404).json({ message: 'Note not found' });
    return null;
  }
  return note;
}

module.exports = { getNotes, getTags, getNote, createNote, updateNote, togglePin, deleteNote };
