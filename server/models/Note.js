const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    // Owner of the note - every query filters on this field (user-specific data isolation)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    content: {
      type: String,
      default: '',
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: [30, 'A tag cannot exceed 30 characters'] }],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 10,
        message: 'A note can have at most 10 tags',
      },
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  // Adds createdAt and updatedAt timestamps automatically
  { timestamps: true }
);

// Remove empty and duplicate tags before validating
noteSchema.pre('validate', function () {
  if (Array.isArray(this.tags)) {
    const cleaned = this.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
    this.tags = [...new Set(cleaned)];
  }
});

module.exports = mongoose.model('Note', noteSchema);
