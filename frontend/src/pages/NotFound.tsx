import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: '#0b0d14' }}>
      <div className="max-w-md w-full rounded-lg border border-navy-700 bg-navy-800 p-8 space-y-5">
        <div className="w-14 h-14 rounded-lg bg-brand-muted border border-brand/20 flex items-center justify-center mx-auto text-brand-light font-black text-xl">
          404
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Page not found</h2>
          <p className="text-xs text-slate-400 mt-1">
            The page you requested does not exist or you do not have access.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded border border-navy-700 bg-navy-800 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-navy-600 hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
          >
            <Home className="h-4 w-4" /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
