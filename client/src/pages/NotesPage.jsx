import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { notesApi, errorMessage } from '../api/client';
import NoteCard from '../components/NoteCard';
import Spinner from '../components/Spinner';

export default function NotesPage() {
  // Search and filters live in the URL (?search=..&tag=..&pinned=..) so they survive refresh
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const tag = params.get('tag') || '';
  const pinned = params.get('pinned') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]); // [{ tag, count }] from the aggregation endpoint
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Flash message passed from the form page after save
  const location = useLocation();
  const [flash, setFlash] = useState(location.state?.flash || '');

  // Hide the flash message after 3 seconds
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 3000);
    return () => clearTimeout(t);
  }, [flash]);

  const updateParam = useCallback(
    (key, value) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Debounce: wait 300ms after typing stops before searching
  useEffect(() => {
    const t = setTimeout(() => updateParam('search', searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput, updateParam]);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [noteList, tagList] = await Promise.all([notesApi.list({ search, tag, pinned }), notesApi.tags()]);
      setNotes(noteList);
      setTags(tagList);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, tag, pinned]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleTogglePin = async (note) => {
    setBusyId(note._id);
    try {
      await notesApi.togglePin(note._id);
      await loadNotes(); // reload so the sort order (pinned first) is correct
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    setBusyId(note._id);
    try {
      await notesApi.remove(note._id);
      setNotes((list) => list.filter((n) => n._id !== note._id));
      setFlash('Note deleted');
      notesApi.tags().then(setTags).catch(() => {});
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setParams({}, { replace: true });
  };

  // Clicking a view or tag replaces the other filters with just that one
  const showView = (key, value) => {
    setSearchInput('');
    setParams(value ? { [key]: value } : {}, { replace: true });
  };

  const hasFilters = Boolean(search || tag || pinned);
  const pinnedNotes = notes.filter((n) => n.pinned);
  const otherNotes = notes.filter((n) => !n.pinned);

  const heading = tag ? `#${tag}` : pinned === 'true' ? 'Pinned notes' : search ? 'Search results' : 'All notes';

  const renderGrid = (list) => (
    <div className="notes-grid">
      {list.map((note) => (
        <NoteCard
          key={note._id}
          note={note}
          busy={busyId === note._id}
          onTogglePin={handleTogglePin}
          onDelete={handleDelete}
          onTagClick={(t) => showView('tag', t)}
        />
      ))}
    </div>
  );

  return (
    <div className="workspace">
      {/* ---------- Sidebar: views and tags ---------- */}
      <aside className="sidebar">
        <Link to="/notes/new" className="btn btn-primary btn-block">
          + New note
        </Link>

        <nav className="side-group" aria-label="Views">
          <span className="side-label">Views</span>
          <button className={`side-item ${!hasFilters ? 'active' : ''}`} onClick={() => showView()}>
            All notes
          </button>
          <button className={`side-item ${pinned === 'true' ? 'active' : ''}`} onClick={() => showView('pinned', 'true')}>
            Pinned
          </button>
        </nav>

        <nav className="side-group" aria-label="Tags">
          <span className="side-label">Tags</span>
          {tags.length === 0 && <span className="side-empty">Tags you add show up here</span>}
          {tags.map(({ tag: t, count }) => (
            <button key={t} className={`side-item ${tag === t ? 'active' : ''}`} onClick={() => showView('tag', t)}>
              <span>#{t}</span>
              <span className="side-count">{count}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ---------- Main column ---------- */}
      <main className="notes-main">
        <div className="page-head">
          <div>
            <h1>{heading}</h1>
            <p className="meta">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              {pinnedNotes.length > 0 && ` · ${pinnedNotes.length} pinned`}
              {hasFilters && (
                <>
                  {' · '}
                  <button className="link-btn" onClick={clearFilters}>
                    clear filters
                  </button>
                </>
              )}
            </p>
          </div>
          <input
            type="search"
            className="search"
            placeholder="Search notes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search notes"
          />
        </div>

        {flash && <div className="alert alert-success">{flash}</div>}
        {error && (
          <div className="alert alert-error">
            {error}{' '}
            <button className="link-btn" onClick={loadNotes}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <Spinner label="Loading notes..." />
        ) : notes.length === 0 ? (
          <div className="empty">
            {hasFilters ? (
              <>
                <h2>Nothing matches</h2>
                <p className="meta">Try a different search, or clear the filters.</p>
                <button className="btn" onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h2>Your notebook is empty</h2>
                <p className="meta">Write your first note to get started.</p>
                <Link to="/notes/new" className="btn btn-primary">
                  + New note
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <section>
                <h2 className="section-title">Pinned</h2>
                {renderGrid(pinnedNotes)}
              </section>
            )}
            {otherNotes.length > 0 && (
              <section>
                {pinnedNotes.length > 0 && <h2 className="section-title">Everything else</h2>}
                {renderGrid(otherNotes)}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
