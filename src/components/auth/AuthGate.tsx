import React, { useEffect, useState } from 'react';
import { Layers, Loader2, LogIn } from 'lucide-react';
import { apiClient, ApiError, AUTH_REQUIRED_EVENT } from '../../api/client';

/**
 * Renders children only once the user is signed in to the shared backend.
 * In mock mode (no VITE_API_BASE_URL) it is a pass-through.
 */
export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authed, setAuthed] = useState(apiClient.isAuthenticated());

  useEffect(() => {
    const onAuthRequired = () => setAuthed(false);
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
  }, []);

  if (authed) return <>{children}</>;
  return <LoginView onSuccess={() => setAuthed(true)} />;
};

const LoginView: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.login(email.trim(), password);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Invalid email or password.'
          : 'Could not reach the Blueprint API. Try again shortly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-[#E9EAEC] rounded-xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#202124] flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#202124] tracking-tight">Scout</h1>
            <p className="text-xs text-[#70757D]">Sign in with your Blueprint account</p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#202124]">Email</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E9EAEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#202124]/20 focus:border-[#202124]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#202124]">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E9EAEC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#202124]/20 focus:border-[#202124]"
          />
        </label>

        {error && (
          <p role="alert" className="text-xs text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#202124] hover:bg-[#3C4043] disabled:opacity-60 rounded-lg transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Sign in
        </button>
      </form>
    </div>
  );
};
