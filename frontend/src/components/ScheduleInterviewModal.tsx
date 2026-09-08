import React, { useState } from 'react';
import { X, Calendar, Clock, Video, MapPin, User, FileText, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/formatters';

export interface InterviewData {
  id?: string;
  applicationId?: string;
  scheduledAt?: string;
  locationOrLink?: string;
  interviewerName?: string;
  status?: string;
  type?: string;
  notes?: string | null;
}

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  candidateName?: string;
  jobTitle?: string;
  existingInterview?: InterviewData | null;
  onSuccess: () => void;
}

function getInitialFormValues(existingInterview?: InterviewData | null) {
  if (existingInterview) {
    let dStr = '';
    let tStr = '';
    if (existingInterview.scheduledAt) {
      const d = new Date(existingInterview.scheduledAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      dStr = `${year}-${month}-${day}`;
      tStr = `${hours}:${minutes}`;
    }
    return {
      date: dStr,
      time: tStr,
      type: existingInterview.type || 'ONLINE',
      locationOrLink: existingInterview.locationOrLink || '',
      interviewerName: existingInterview.interviewerName || '',
      notes: existingInterview.notes || '',
      status: existingInterview.status || 'SCHEDULED',
    };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  let defaultInterviewer = '';
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      defaultInterviewer = u.fullName || u.email?.split('@')[0] || '';
    }
  } catch {
    defaultInterviewer = '';
  }

  return {
    date: `${year}-${month}-${day}`,
    time: '09:00',
    type: 'ONLINE',
    locationOrLink: 'https://meet.google.com/',
    interviewerName: defaultInterviewer,
    notes: '',
    status: 'SCHEDULED',
  };
}

function ModalContent({
  onClose,
  applicationId,
  candidateName,
  jobTitle,
  existingInterview,
  onSuccess,
}: Omit<ScheduleInterviewModalProps, 'isOpen'>) {
  const isEditing = Boolean(existingInterview?.id);
  const initialValues = getInitialFormValues(existingInterview);

  const [date, setDate] = useState(initialValues.date);
  const [time, setTime] = useState(initialValues.time);
  const [type, setType] = useState(initialValues.type);
  const [locationOrLink, setLocationOrLink] = useState(initialValues.locationOrLink);
  const [interviewerName, setInterviewerName] = useState(initialValues.interviewerName);
  const [notes, setNotes] = useState(initialValues.notes);
  const [status, setStatus] = useState(initialValues.status);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Vui lòng chọn ngày và giờ phỏng vấn.');
      return;
    }
    if (!locationOrLink.trim()) {
      setError('Vui lòng nhập địa điểm hoặc link cuộc họp.');
      return;
    }
    if (!interviewerName.trim()) {
      setError('Vui lòng nhập tên người phỏng vấn.');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledDate.getTime())) {
      setError('Thời gian phỏng vấn không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing && existingInterview?.id) {
        await api.put(`/interview/${existingInterview.id}`, {
          scheduledAt: scheduledDate.toISOString(),
          locationOrLink: locationOrLink.trim(),
          interviewerName: interviewerName.trim(),
          type,
          notes: notes.trim() || null,
          status,
        });
      } else {
        const targetAppId = applicationId || existingInterview?.applicationId;
        if (!targetAppId) {
          setError('Thiếu thông tin đơn ứng tuyển (applicationId).');
          setLoading(false);
          return;
        }

        await api.post('/interview', {
          applicationId: targetAppId,
          scheduledAt: scheduledDate.toISOString(),
          locationOrLink: locationOrLink.trim(),
          interviewerName: interviewerName.trim(),
          type,
          notes: notes.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Không thể lưu lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {isEditing ? 'Chỉnh sửa lịch phỏng vấn' : 'Lên lịch phỏng vấn mới'}
            </span>
            <h3 className="mt-1.5 text-lg font-bold text-slate-900">
              {candidateName ? `Ứng viên: ${candidateName}` : 'Thông tin phỏng vấn'}
            </h3>
            {jobTitle && (
              <p className="text-xs text-slate-500 mt-0.5">Vị trí: {jobTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> Ngày phỏng vấn *
                </span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> Giờ bắt đầu *
                </span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Type & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hình thức phỏng vấn
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="ONLINE">🌐 Trực tuyến (Online)</option>
                <option value="OFFLINE">🏢 Trực tiếp (Offline)</option>
              </select>
            </div>

            {isEditing ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="SCHEDULED">📅 Sắp diễn ra (SCHEDULED)</option>
                  <option value="COMPLETED">✅ Đã hoàn thành (COMPLETED)</option>
                  <option value="CANCELLED">❌ Đã hủy (CANCELLED)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" /> Người phỏng vấn *
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A (HR)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Người phỏng vấn *
                </span>
              </label>
              <input
                type="text"
                required
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A (HR)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Location / Meeting Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                {type === 'ONLINE' ? (
                  <Video className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                )}
                {type === 'ONLINE' ? 'Link cuộc họp (Google Meet / Zoom) *' : 'Địa điểm phỏng vấn *'}
              </span>
            </label>
            <input
              type="text"
              required
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder={type === 'ONLINE' ? 'https://meet.google.com/xyz-abcd-efg' : 'Tầng 5, Tòa nhà FPT, Cầu Giấy, Hà Nội'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Ghi chú cho ứng viên / hội đồng
              </span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chuẩn bị CV bản cứng, laptop, hoặc tài liệu cần thiết..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật lịch' : 'Tạo lịch phỏng vấn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScheduleInterviewModal(props: ScheduleInterviewModalProps) {
  if (!props.isOpen) return null;
  return <ModalContent {...props} />;
}
