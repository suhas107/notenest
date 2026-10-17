import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        NoteNest
      </Link>
      {user && (
        <div className="nav-right">
          <span className="nav-user">{user.name}</span>
          <button className="btn btn-ghost btn-small" onClick={logout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
