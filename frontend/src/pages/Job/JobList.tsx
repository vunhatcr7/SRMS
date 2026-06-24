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

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center mt-10 font-medium text-gray-500">🔄 Đang tải danh sách việc làm...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
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
                  <h3 className="text-xl font-bold text-indigo-600 hover:underline cursor-pointer">{job.title}</h3>
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
                <p className="text-sm text-gray-600 line-clamp-2"><strong>Mô tả:</strong> {job.description}</p>
              </div>

              <div className="mt-4 flex justify-end">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                  Ứng Tuyển Ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}