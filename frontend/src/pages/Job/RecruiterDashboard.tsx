import { useEffect, useState } from 'react';
import api from '../../api/axios';

interface Application {
  id: string;
  stage: string;
  createdAt: string;
  matchingScore: number;
  skillScore: number;
  experienceScore: number;
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

// Danh sách các trạng thái khớp với enum ProcessStage trong Prisma
const STAGES = [
  { value: 'APPLIED', label: '📥 Đã nộp đơn' },
  { value: 'SCREENING', label: '🔍 Lọc hồ sơ' },
  { value: 'INTERVIEW', label: '📅 Phỏng vấn' },
  { value: 'OFFER', label: '🎉 Gửi Offer' },
  { value: 'HIRED', label: '✅ Đã tuyển' },
  { value: 'REJECTED', label: '❌ Từ chối' },
];

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

const fetchApplications = () => {
    api.get('/application/recruiter')
      .then((response) => {
        if (Array.isArray(response.data)) {
          setApplications([...response.data].sort((left, right) => right.matchingScore - left.matchingScore));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách đơn:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 🔥 Hàm xử lý khi nhà tuyển dụng đổi trạng thái trong Dropdown
  const handleStageChange = async (applicationId: string, newStage: string) => {
    setUpdatingId(applicationId);
    try {
      const response = await api.put('/application/update-stage', { applicationId, stage: newStage });

      if (response.status >= 200 && response.status < 300) {
        // Cập nhật lại state cục bộ ngay lập tức để giao diện thay đổi theo mà không cần load lại trang
        setApplications((prev) =>
          prev.map((app) => (app.id === applicationId ? { ...app, stage: newStage } : app))
        );
        alert('🎉 Cập nhật trạng thái hồ sơ thành công!');
      } else {
        alert(`❌ Thất bại: ${response.data?.message || 'Không thể cập nhật trạng thái.'}`);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái hồ sơ:', error);
      alert('❌ Không thể kết nối đến server!');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      APPLIED: 'text-blue-700 bg-blue-50 border-blue-200',
      SCREENING: 'text-purple-700 bg-purple-50 border-purple-200',
      INTERVIEW: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      TECHNICAL_TEST: 'text-orange-700 bg-orange-50 border-orange-200',
      OFFER: 'text-pink-700 bg-pink-50 border-pink-200',
      HIRED: 'text-green-700 bg-green-50 border-green-200',
      REJECTED: 'text-red-700 bg-red-50 border-red-200',
    };
    return colors[stage] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return <div className="text-center mt-10 font-medium text-gray-500">🔄 Đang tải danh sách hồ sơ...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h2 className="text-3xl font-bold mb-2 text-gray-800">📊 Dashboard Nhà Tuyển Dụng</h2>
      <p className="text-gray-500 mb-6">Quản lý, chuyển đổi trạng thái vòng đời ứng tuyển của ứng viên.</p>

      {applications.length === 0 ? (
        <div className="text-center p-12 bg-white border border-gray-200 rounded-2xl text-gray-400">
          📥 Chưa có ứng viên nào nộp đơn.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="p-4">Ứng viên</th>
                <th className="p-4">Vị trí ứng tuyển</th>
                <th className="p-4">Ngày nộp</th>
                <th className="p-4">AI Score</th>
                <th className="p-4">Trạng thái xử lý</th>
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
                    <span className="font-black text-indigo-600">{app.matchingScore ?? 0}%</span>
                    <span className="block text-[11px] text-gray-400">Kỹ năng {app.skillScore ?? 0}%</span>
                  </td>
                  <td className="p-4">
                    {/* 🔴 DROPDOWN CHUYỂN TRẠNG THÁI */}
                    <select
                      disabled={updatingId === app.id}
                      value={app.stage}
                      onChange={(e) => handleStageChange(app.id, e.target.value)}
                      className={`p-1.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer shadow-sm transition min-w-[130px] ${getStageColor(app.stage)} disabled:opacity-50`}
                    >
                      {STAGES.map((stg) => (
                        <option key={stg.value} value={stg.value} className="bg-white text-gray-800 font-normal">
                          {stg.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <a 
                      href={app.candidateProfile?.resumeUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
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