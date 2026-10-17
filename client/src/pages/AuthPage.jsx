import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// One component for both Login and Register; `mode` decides which fields to show
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  // Client-side validation before calling the API
  const validate = () => {
    const next = {};
    if (isRegister && !form.name.trim()) next.name = 'Name is required';
    if (!EMAIL_REGEX.test(form.email)) next.email = 'Enter a valid email address';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (isRegister && form.password !== form.confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      } else {
        await login({ email: form.email.trim(), password: form.password });
      }
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <h1>
          Your notes,
          <br />
          <span className="highlight">kept in one place.</span>
        </h1>
        <p>Write, tag, pin and search everything from lecture notes to grocery lists. Your notes are private to your account.</p>
        <ul className="auth-points">
          <li>Search across titles, content and tags</li>
          <li>Pin what matters to the top</li>
          <li>Organise with tags and see counts at a glance</li>
        </ul>
      </section>

      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h2>{isRegister ? 'Create your account' : 'Log in'}</h2>
        <p className="meta">{isRegister ? 'It takes less than a minute.' : 'Welcome back. Pick up where you left off.'}</p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        {isRegister && (
          <Field label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} autoComplete="name" />
        )}
        <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        {isRegister && (
          <Field
            label="Confirm password"
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
            autoComplete="new-password"
          />
        )}

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Please wait...' : isRegister ? 'Sign up' : 'Log in'}
        </button>

        {!isRegister && (
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => setForm({ ...form, email: 'demo@notenest.app', password: 'demo123' })}
          >
            Fill in the demo account
          </button>
        )}

        <p className="switch">
          {isRegister ? (
            <>Already have an account? <Link to="/login">Log in</Link></>
          ) : (
            <>New here? <Link to="/register">Create an account</Link></>
          )}
        </p>
      </form>
    </div>
  );
}

function Field({ label, name, error, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} className={error ? 'invalid' : ''} {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
