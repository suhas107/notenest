import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { notesApi, errorMessage } from '../api/client';
import Spinner from '../components/Spinner';

const TITLE_MAX = 100;
const CONTENT_MAX = 10000;
const TAGS_MAX = 10;

// Turns "work, Ideas, work" into ["work", "ideas"]
const parseTags = (text) => [...new Set(text.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];

// Used for both creating (/notes/new) and editing (/notes/:id/edit)
export default function NoteFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', content: '', tags: '', pinned: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // When editing, load the existing note into the form
  useEffect(() => {
    if (!isEdit) return;
    notesApi
      .get(id)
      .then((note) =>
        setForm({ title: note.title, content: note.content, tags: note.tags.join(', '), pinned: note.pinned })
      )
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const next = {};
    const tags = parseTags(form.tags);
    if (!form.title.trim()) next.title = 'Title is required';
    else if (form.title.trim().length > TITLE_MAX) next.title = `Title cannot exceed ${TITLE_MAX} characters`;
    if (form.content.length > CONTENT_MAX) next.content = `Content cannot exceed ${CONTENT_MAX} characters`;
    if (tags.length > TAGS_MAX) next.tags = `You can add at most ${TAGS_MAX} tags`;
    else if (tags.some((t) => t.length > 30)) next.tags = 'Each tag must be 30 characters or less';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    // JSON body sent to the API
    const payload = {
      title: form.title.trim(),
      content: form.content,
      tags: parseTags(form.tags),
      pinned: form.pinned,
    };

    setSaving(true);
    try {
      if (isEdit) await notesApi.update(id, payload);
      else await notesApi.create(payload);
      navigate('/', { state: { flash: isEdit ? 'Note updated' : 'Note created' } });
    } catch (err) {
      setServerError(errorMessage(err));
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading note..." />;

  if (loadError) {
    return (
      <main className="container narrow">
        <div className="alert alert-error">{loadError}</div>
        <Link to="/" className="btn">
          ← Back to notes
        </Link>
      </main>
    );
  }

  const tagPreview = parseTags(form.tags);

  return (
    <main className="container narrow">
      <Link to="/" className="back-link">
        ← Back to notes
      </Link>
      <form className="card note-form sheet" onSubmit={handleSubmit} noValidate>
        <h1>{isEdit ? 'Edit note' : 'New note'}</h1>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <label className="field">
          <span>
            Title <em className="counter">{form.title.length}/{TITLE_MAX}</em>
          </span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className={`title-input ${errors.title ? 'invalid' : ''}`}
            placeholder="e.g. Exam revision plan"
            autoFocus
          />
          {errors.title && <small className="field-error">{errors.title}</small>}
        </label>

        <label className="field">
          <span>
            Content <em className="counter">{form.content.length}/{CONTENT_MAX}</em>
          </span>
          <textarea
            name="content"
            rows="14"
            value={form.content}
            onChange={handleChange}
            className={`lined ${errors.content ? 'invalid' : ''}`}
            placeholder="Write your note..."
          />
          {errors.content && <small className="field-error">{errors.content}</small>}
        </label>

        <label className="field">
          <span>Tags (comma separated)</span>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            className={errors.tags ? 'invalid' : ''}
            placeholder="e.g. college, exams, todo"
          />
          {errors.tags && <small className="field-error">{errors.tags}</small>}
          {tagPreview.length > 0 && (
            <div className="tags">
              {tagPreview.map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </label>

        <label className="checkbox">
          <input type="checkbox" name="pinned" checked={form.pinned} onChange={handleChange} />
          Pin this note to the top
        </label>

        <div className="form-actions">
          <Link to="/" className="btn btn-ghost">
            Cancel
          </Link>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create note'}
          </button>
        </div>
      </form>
    </main>
  );
}
