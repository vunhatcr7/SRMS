import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Please select date and time.');
      return;
    }
    if (!locationOrLink.trim()) {
      setError('Please enter location or meeting link.');
      return;
    }
    if (!interviewerName.trim()) {
      setError('Please enter interviewer name.');
      return;
    }

    const scheduledDate = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledDate.getTime())) {
      setError('Invalid date/time.');
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
          setError('Missing application ID.');
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
      setError(getErrorMessage(err) || 'Unable to save interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg rounded-lg border shadow-card ${isDark ? 'border-navy-700 bg-navy-800' : 'border-slate-200 bg-white'}`}>
        <div className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${isDark ? 'border-navy-700' : 'border-slate-200'}`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-brand-light' : 'text-brand'}`}>
              {isEditing ? 'Edit interview' : 'Schedule interview'}
            </span>
            <h3 className="mt-1 text-lg font-bold text-slate-100">
              {candidateName ? `Candidate: ${candidateName}` : 'Interview details'}
            </h3>
            {jobTitle && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Position: {jobTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded border p-1.5 transition ${isDark ? 'border-navy-700 text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className={`mx-5 mt-4 flex items-center gap-2 rounded-lg border p-3 text-xs font-medium ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" /> Interview date *
                </span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Start time *
                </span>
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Interview type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
              >
                <option value="ONLINE">Online (Video call)</option>
                <option value="OFFLINE">On-site</option>
              </select>
            </div>

            {isEditing ? (
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            ) : (
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-500" /> Interviewer *
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  placeholder="e.g. Nguyen Van A (HR)"
                  className={`w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-500" /> Interviewer *
                </span>
              </label>
              <input
                type="text"
                required
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="e.g. Nguyen Van A (HR)"
                className={`w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
              />
            </div>
          )}

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1">
                {type === 'ONLINE' ? (
                  <Video className="h-3.5 w-3.5 text-slate-500" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                )}
                {type === 'ONLINE' ? 'Meeting link (Google Meet / Zoom) *' : 'Interview location *'}
              </span>
            </label>
            <input
              type="text"
              required
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder={type === 'ONLINE' ? 'https://meet.google.com/xyz-abcd-efg' : 'Floor 5, FPT Building, Hanoi'}
              className={`w-full rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-slate-500" /> Notes for candidate / panel
              </span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Prepare CV, laptop, or required documents..."
              className={`w-full resize-none rounded border bg-transparent px-3 py-2 text-sm outline-none transition ${isDark ? 'border-navy-700 text-slate-100 focus:border-brand' : 'border-slate-200 text-slate-900 focus:border-brand'}`}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-navy-700">
            <button
              type="button"
              onClick={onClose}
              className={`rounded border px-4 py-2 text-xs font-semibold transition ${isDark ? 'border-navy-700 bg-navy-800 text-slate-300 hover:bg-navy-750' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded bg-brand px-5 py-2 text-xs font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? 'Saving...' : isEditing ? 'Update interview' : 'Schedule interview'}
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
