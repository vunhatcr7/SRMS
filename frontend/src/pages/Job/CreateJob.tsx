import { useState } from 'react';
import { BriefcaseBusiness, Building2, CheckCircle2, CircleDollarSign, FileText, MapPin, Send, XCircle } from 'lucide-react';
import api from '../../api/axios';

interface JobForm {
  title: string;
  companyName: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string;
}

const initialForm: JobForm = {
  title: '',
  companyName: '',
  location: '',
  salaryRange: '',
  description: '',
  requirements: '',
};

const fields: Array<{ name: keyof JobForm; label: string; placeholder: string }> = [
  { name: 'title', label: 'Tên vị trí', placeholder: 'Ví dụ: Frontend Developer' },
  { name: 'companyName', label: 'Tên công ty', placeholder: 'Ví dụ: FPT Software' },
  { name: 'location', label: 'Địa điểm', placeholder: 'Hồ Chí Minh, Hà Nội hoặc Remote' },
  { name: 'salaryRange', label: 'Mức lương', placeholder: 'Ví dụ: 15M - 25M hoặc Thỏa thuận' },
];

export default function CreateJob() {
  const [form, setForm] = useState<JobForm>(initialForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (name: keyof JobForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitJob = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);
    try {
      await api.post('/job/create', form);
      setForm(initialForm);
      setMessage('Đăng tin tuyển dụng thành công.');
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      setMessage(response?.data?.message || 'Không thể đăng tin tuyển dụng.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuccess = message.includes('thành công');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600"><BriefcaseBusiness className="h-4 w-4" /> Tuyển dụng</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Đăng tin tuyển dụng</h1>
        <p className="mt-1 text-sm text-slate-500">Tạo một mô tả rõ ràng để thu hút đúng ứng viên.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <form onSubmit={submitJob} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((field) => <label key={field.name} className="block text-sm font-semibold text-slate-700"><span>{field.label}</span>{field.name !== 'salaryRange' && <span className="text-red-500"> *</span>}<input required={field.name !== 'salaryRange'} type="text" value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)} placeholder={field.placeholder} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>)}
          </div>
          <label className="mt-5 block text-sm font-semibold text-slate-700">Mô tả công việc <span className="text-red-500">*</span><textarea required minLength={20} rows={6} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Mô tả nhiệm vụ, môi trường và trách nhiệm chính..." className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>
          <label className="mt-5 block text-sm font-semibold text-slate-700">Yêu cầu ứng viên <span className="text-red-500">*</span><textarea required minLength={10} rows={5} value={form.requirements} onChange={(event) => updateField('requirements', event.target.value)} placeholder="Kỹ năng, kinh nghiệm và yêu cầu cần thiết..." className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500" /></label>
          {message && <p className={`mt-5 flex items-center gap-2 rounded-lg p-3 text-sm ${isSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{message}</p>}
          <div className="mt-6 flex justify-end"><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:bg-slate-400"><Send className="h-4 w-4" />{submitting ? 'Đang đăng...' : 'Đăng tin'}</button></div>
        </form>

        <aside className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><FileText className="h-4 w-4 text-blue-600" /> Kiểm tra nhanh</div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600"><li className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />Tên công ty giúp ứng viên nhận diện nhà tuyển dụng.</li><li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />Ghi rõ địa điểm hoặc hình thức làm việc.</li><li className="flex gap-2"><CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />Mức lương có thể để trống nếu thỏa thuận.</li></ul>
          <div className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">Sau khi đăng, tin tuyển dụng sẽ xuất hiện trong danh sách việc làm và được dùng để matching ứng viên.</div>
        </aside>
      </div>
    </div>
  );
}
