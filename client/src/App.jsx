import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import NotesPage from './pages/NotesPage';
import NoteFormPage from './pages/NoteFormPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Only for logged-out users */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Route>

        {/* Protected: need a valid JWT */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<NotesPage />} />
          <Route path="/notes/new" element={<NoteFormPage />} />
          <Route path="/notes/:id/edit" element={<NoteFormPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
