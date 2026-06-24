import { useEffect, useState } from 'react';

interface Company {
  name: string;
}

interface Job {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string;
  company: Company;
  createdAt: string;
}

export default function AppJobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // States quản lý Modal ứng tuyển
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/v1/job')
      .then((res) => res.json())
      .then((data) => {
        setJobs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi lấy danh sách job:', err);
        setLoading(false);
      });
  }, []);

  // Hàm mở modal và thiết lập Job đang được chọn
  const handleOpenModal = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
    setSubmitMessage('');
    setResumeUrl('');
    setCoverLetter('');
  };

  // Hàm xử lý gửi đơn ứng tuyển lên Backend
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const token = localStorage.getItem('srms_token'); // Lấy token đăng nhập của ứng viên
      console.log('Token đăng nhập:', token); // Debug: In ra token để kiểm tra
      const response = await fetch('http://localhost:5000/api/v1/application/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          resumeUrl,
          coverLetter
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage('🎉 Nộp đơn ứng tuyển thành công! Chúc bạn may mắn.');
        // Tự động đóng modal sau 2 giây để trải nghiệm mượt mà hơn
        setTimeout(() => {
          setIsModalOpen(false);
        }, 2000);
      } else {
        setSubmitMessage(`❌ Lỗi: ${data.message}`);
      }
    } catch (error) {
    console.error('Lỗi khi nộp đơn ứng tuyển:', error);
      setSubmitMessage('❌ Không thể kết nối đến server Backend!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-10 font-medium text-gray-500">🔄 Đang tải danh sách việc làm...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 relative">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">💼 Cơ Hội Việc Làm Mới Nhất</h2>
      
      {jobs.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg text-gray-500">
          Hiện tại chưa có tin tuyển dụng nào được đăng.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md transition duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-indigo-600">{job.title}</h3>
                  <p className="text-sm font-semibold text-gray-600 mt-1">🏢 {job.company?.name}</p>
                </div>
                <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  💰 {job.salaryRange || 'Thỏa thuận'}
                </span>
              </div>
              
              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                <span>📍 {job.location}</span>
                <span>📅 Đăng ngày: {new Date(job.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600"><strong>Mô tả:</strong> {job.description}</p>
                <p className="text-sm text-gray-600 mt-2"><strong>Yêu cầu:</strong> {job.requirements}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => handleOpenModal(job)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Ứng Tuyển Ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔴 GIAO DIỆN MODAL POPUP (Chỉ hiển thị khi mở) */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-1">Ứng tuyển vị trí</h3>
            <p className="text-indigo-600 font-semibold mb-4">{selectedJob.title} - {selectedJob.company?.name}</p>
            
            {submitMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${submitMessage.includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn CV (Link Drive/Dropbox/Dropbox...)</label>
                <input 
                  type="url" 
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thư giới thiệu (Cover Letter)</label>
                <textarea 
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Giới thiệu ngắn gọn về thế mạnh của bạn..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 bg-gray-100 text-gray-700 p-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 bg-indigo-600 text-white p-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:bg-indigo-400"
                >
                  {isSubmitting ? '⏳ Đang nộp đơn...' : 'Gửi Đơn Ứng Tuyển'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}