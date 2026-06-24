import { useEffect, useState } from 'react';

interface Application {
  id: string;
  stage: string;
  createdAt: string;
  job: {
    title: string;
    location: string;
  };
  candidateProfile: {
    resumeUrl: string;
    user: {
      fullName: string;
      email: string;
      phone: string;
    };
  };
}

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('srms_token');
    
    fetch('http://localhost:5000/api/v1/application/recruiter', {
      headers: {
        'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setApplications(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách đơn:', err);
        setLoading(false);
      });
  }, []);

  const getStageBadge = (stage: string) => {
    const badges: { [key: string]: string } = {
      APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
      SCREENING: 'bg-purple-50 text-purple-700 border-purple-200',
      INTERVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      HIRED: 'bg-green-50 text-green-700 border-green-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
    };
    return badges[stage] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return <div className="text-center mt-10 font-medium text-gray-500">🔄 Đang tải danh sách hồ sơ...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">📊 Dashboard Nhà Tuyển Dụng</h2>
      <p className="text-gray-500 mb-6">Quản lý và duyệt danh sách hồ sơ ứng viên nộp vào các tin tuyển dụng của bạn.</p>

      {applications.length === 0 ? (
        <div className="text-center p-12 bg-white border border-gray-200 rounded-2xl text-gray-400">
          📥 Chưa có ứng viên nào nộp đơn vào các vị trí của bạn.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="p-4">Ứng viên</th>
                <th className="p-4">Vị trí ứng tuyển</th>
                <th className="p-4">Ngày nộp</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{app.candidateProfile?.user?.fullName || 'Chưa cập nhật'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{app.candidateProfile?.user?.email}</div>
                    <div className="text-xs text-gray-400">{app.candidateProfile?.user?.phone || 'Không có SĐT'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-indigo-600">{app.job?.title}</div>
                    <div className="text-xs text-gray-500">📍 {app.job?.location}</div>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getStageBadge(app.stage)}`}>
                      {app.stage}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <a 
                      href={app.candidateProfile?.resumeUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition mr-2"
                    >
                      📄 Xem CV
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}