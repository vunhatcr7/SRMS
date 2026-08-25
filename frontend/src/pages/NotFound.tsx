import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 font-black text-2xl">
          404
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Không tìm thấy trang</h2>
          <p className="text-xs text-slate-500 mt-1">
            Đường dẫn bạn yêu cầu không tồn tại hoặc bạn không có quyền truy cập.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow transition"
          >
            <Home className="h-4 w-4" /> Trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
