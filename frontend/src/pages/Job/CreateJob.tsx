import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle2, AlertCircle, Briefcase, MapPin, DollarSign, Building2, FileText, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import { getErrorMessage } from '../../utils/formatters';

interface FormData {
  title: string;
  companyName: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string;
}

const INITIAL_FORM: FormData = {
  title: '',
  companyName: '',
  location: '',
  salaryRange: '',
  description: '',
  requirements: '',
};

export default function CreateJob() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      await api.post('/job/create', formData);
      setIsSuccess(true);
      setMessage('Đăng tin tuyển dụng thành công!');
      setFormData(INITIAL_FORM);
    } catch (error) {
      setIsSuccess(false);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 mb-2">
          <PlusCircle className="h-4 w-4" />
          Tuyển dụng
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Đăng tin tuyển dụng mới</h2>
        <p className="mt-1 text-sm text-slate-500">
          Điền đầy đủ thông tin để AI có thể matching ứng viên phù hợp nhất.
        </p>
      </div>

      {/* Alert */}
      {message && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            isSuccess
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{message}</p>
            {isSuccess && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/job/list')}
                  className="text-xs font-bold underline underline-offset-2 hover:no-underline"
                >
                  Xem danh sách việc làm →
                </button>
                <span className="text-emerald-400">·</span>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/recruiter')}
                  className="text-xs font-bold underline underline-offset-2 hover:no-underline"
                >
                  Vào Dashboard →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        {/* Tiêu đề */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            Tiêu đề công việc <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Ví dụ: Senior React Developer"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-indigo-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Công ty & Địa điểm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Tên công ty <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="Ví dụ: FPT Software"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-indigo-400 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              Địa điểm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Hà Nội, TP.HCM, Remote..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-indigo-400 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Mức lương */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            Mức lương
          </label>
          <input
            type="text"
            name="salaryRange"
            value={formData.salaryRange}
            onChange={handleChange}
            placeholder="Ví dụ: 15M – 25M hoặc Thỏa thuận"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-indigo-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Mô tả công việc */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Mô tả công việc (JD) <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Nhiệm vụ cụ thể hàng ngày, trách nhiệm của vị trí này..."
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-indigo-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Yêu cầu */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
            <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
            Yêu cầu ứng viên <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="requirements"
            rows={4}
            value={formData.requirements}
            onChange={handleChange}
            required
            placeholder="Kỹ năng kỹ thuật, số năm kinh nghiệm, trình độ học vấn... (AI sẽ dùng mục này để matching)"
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-indigo-400 focus:bg-white transition-colors"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            💡 Ghi rõ tên kỹ năng (React, Node.js, Python...) để AI matching chính xác hơn.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/recruiter')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400 transition-colors"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang đăng tin...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Đăng Tin Ngay
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}