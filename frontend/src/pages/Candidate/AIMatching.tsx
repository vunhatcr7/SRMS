import { useEffect, useState } from 'react';
import { FileText, Sparkles, Upload, MapPin, Building2 } from 'lucide-react';
import api from '../../api/axios';

interface ParsedResume {
  fullName?: string;
  skills: string[];
  experienceYears: number;
  position?: string;
  education?: string;
  summary?: string;
}

interface Recommendation {
  job: {
    id: string;
    title: string;
    location: string;
    salaryRange?: string;
    company: { name: string };
  };
  matching: {
    matchingScore: number;
    skillScore: number;
    experienceScore: number;
    aiExplanation: string;
  };
}

const getErrorMessage = (error: unknown): string => {
  const response = (error as { response?: { data?: { message?: string } } }).response;
  return response?.data?.message || 'Không thể kết nối tới backend.';
};

export default function AIMatching() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadRecommendations = async () => {
    try {
      const response = await api.get('/job/recommendations?limit=5');
      setRecommendations(response.data.recommendations || []);
    } catch {
      setRecommendations([]);
    }
  };

  useEffect(() => {
    let active = true;
    api.get('/job/recommendations?limit=5')
      .then((response) => {
        if (active) setRecommendations(response.data.recommendations || []);
      })
      .catch(() => {
        if (active) setRecommendations([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAnalyze = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setMessage('Hãy chọn file PDF hoặc DOCX trước.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      await api.post('/candidate/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const response = await api.post('/candidate/resume/parse');
      setParsedResume(response.data.parsedResume);
      await loadRecommendations();
      setMessage('Đã đọc và phân tích CV thành công.');
    } catch (error: unknown) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="rounded-2xl bg-slate-900 px-6 py-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-300"><Sparkles className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">AI Career Match</p>
            <h2 className="mt-2 text-3xl font-bold">Phân tích CV và tìm việc phù hợp</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Tải CV để hệ thống trích xuất kỹ năng, kinh nghiệm và đề xuất vị trí phù hợp.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleAnalyze} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Tải CV</h3>
          </div>
          <label className="mt-5 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-5 py-10 text-center hover:border-indigo-400 hover:bg-indigo-50/30">
            <FileText className="h-9 w-9 text-slate-400" />
            <span className="mt-3 text-sm font-semibold text-slate-700">{file?.name || 'Chọn file PDF hoặc DOCX'}</span>
            <span className="mt-1 text-xs text-slate-400">Tối đa 5 MB</span>
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button type="submit" disabled={loading} className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400">
            {loading ? 'Đang phân tích...' : 'Đọc và phân tích CV'}
          </button>
          {message && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{message}</p>}
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Kết quả phân tích</h3>
          {!parsedResume ? (
            <p className="mt-8 text-sm text-slate-500">Kết quả kỹ năng và kinh nghiệm sẽ xuất hiện sau khi phân tích CV.</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div><p className="text-xs font-semibold uppercase text-slate-400">Ứng viên</p><p className="mt-1 font-semibold text-slate-900">{parsedResume.fullName || 'Chưa xác định'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Vị trí</p><p className="mt-1 text-sm text-slate-700">{parsedResume.position || 'Chưa xác định'} · {parsedResume.experienceYears} năm kinh nghiệm</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Kỹ năng</p><div className="mt-2 flex flex-wrap gap-2">{parsedResume.skills.map((skill) => <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{skill}</span>)}</div></div>
              {parsedResume.summary && <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">{parsedResume.summary}</p>}
            </div>
          )}
        </section>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4"><div><h3 className="text-lg font-bold text-slate-900">Việc làm phù hợp</h3><p className="mt-1 text-sm text-slate-500">Gợi ý được xếp theo điểm matching.</p></div><Sparkles className="h-5 w-5 text-indigo-600" /></div>
        {recommendations.length === 0 ? <p className="mt-6 text-sm text-slate-500">Chưa có gợi ý. Hãy hoàn thiện hồ sơ hoặc phân tích CV.</p> : <div className="mt-5 grid gap-3">{recommendations.map(({ job, matching }) => <article key={job.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h4 className="font-bold text-slate-900">{job.title}</h4><p className="mt-1 flex items-center gap-2 text-xs text-slate-500"><Building2 className="h-3.5 w-3.5" />{job.company.name}<MapPin className="ml-2 h-3.5 w-3.5" />{job.location}</p><p className="mt-2 text-xs text-slate-500">{matching.aiExplanation}</p></div><div className="text-left sm:text-right"><p className="text-2xl font-black text-indigo-600">{matching.matchingScore}%</p><p className="text-[11px] font-semibold uppercase text-slate-400">matching score</p></div></article>)}</div>}
      </section>
    </div>
  );
}
