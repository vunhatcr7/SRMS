import React, { useState } from 'react';

export default function CreateJob() {
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    location: '',
    salaryRange: '',
    description: '',
    requirements: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Lấy token đã lưu từ lúc đăng nhập
      const token = localStorage.getItem('srms_token'); 

      const response = await fetch('http://localhost:5000/api/v1/job/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(' Đăng tin tuyển dụng thành công!');
        setFormData({ title: '', companyName: '', location: '', salaryRange: '', description: '', requirements: '' });
      } else {
        setMessage(`❌ Lỗi: ${data.message}`);
      }
    } catch (error) {
  const err = error as Error;
  setMessage(` Không thể kết nối đến server Backend! Chi tiết: ${err.message}`);
}
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🚀 Tạo Tin Tuyển Dụng Mới</h2>
      {message && <div className="mb-4 p-3 rounded bg-blue-50 text-blue-700 font-medium">{message}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tiêu đề công việc</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" placeholder="Ví dụ: React Developer" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên công ty</label>
            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" placeholder="Tên doanh nghiệp" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa điểm</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" placeholder="Hà Nội, TP.HCM, Remote" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mức lương</label>
          <input type="text" name="salaryRange" value={formData.salaryRange} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" placeholder="Ví dụ: 15M - 25M, Thỏa thuận" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mô tả công việc (JD)</label>
          <textarea name="description" rows={4} value={formData.description} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" placeholder="Nhiệm vụ cụ thể hàng ngày..."></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Yêu cầu ứng viên</label>
          <textarea name="requirements" rows={4} value={formData.requirements} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-gray-50 border" placeholder="Kỹ năng bắt buộc, số năm kinh nghiệm..."></textarea>
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-md font-semibold hover:bg-indigo-700 transition duration-200">Đăng Tin Ngay</button>
      </form>
    </div>
  );
}