import { Link } from 'react-router-dom';

// "14 Oct" for this year, "14 Oct 2025" for older notes
const formatDate = (iso) => {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' });
};

export default function NoteCard({ note, onTogglePin, onDelete, onTagClick, busy }) {
  return (
    <article className={`note-card ${note.pinned ? 'pinned' : ''}`}>
      <div className="note-head">
        <h3>
          <Link to={`/notes/${note._id}/edit`} className="note-title">
            {note.title}
          </Link>
        </h3>
        <button
          className={`pin-btn ${note.pinned ? 'active' : ''}`}
          onClick={() => onTogglePin(note)}
          disabled={busy}
          title={note.pinned ? 'Unpin note' : 'Pin note'}
          aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M15 3l6 6-3 1-4 4 1 5-2 2-4-4-5 5-1-1 5-5-4-4 2-2 5 1 4-4z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {note.content && <p className="note-content">{note.content}</p>}

      {note.tags.length > 0 && (
        <div className="tags">
          {note.tags.map((tag) => (
            <button key={tag} className="tag" onClick={() => onTagClick(tag)}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="note-foot">
        <time dateTime={note.updatedAt} title={`Created ${new Date(note.createdAt).toLocaleString()}`}>
          {formatDate(note.updatedAt)}
        </time>
        <div className="note-actions">
          <Link to={`/notes/${note._id}/edit`} className="text-btn">
            Edit
          </Link>
          <button className="text-btn danger" onClick={() => onDelete(note)} disabled={busy}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
