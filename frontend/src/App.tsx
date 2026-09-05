import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import JobList from './pages/Job/JobList';
import RecruiterDashboard from './pages/Job/RecruiterDashboard';
import MainLayout from './components/Layouts/MainLayout'; 
import CandidateLayout from './components/Layouts/CandidateLayout';
import CandidateDashboard from './pages/Candidate/CandidateDashboard';
import CandidateJobs from './pages/Candidate/CandidateJobs';
import CandidateJobDetail from './pages/Candidate/CandidateJobDetail';
import CandidateApplications from './pages/Candidate/CandidateApplications';
import CandidateApplicationDetail from './pages/Candidate/CandidateApplicationDetail';
import CandidateProfile from './pages/Candidate/CandidateProfile';
import CandidateDetail from './pages/Candidate/CandidateDetail';
import AIRanking from './pages/Job/AIRanking';
import NotFound from './pages/NotFound';
import PlaceholderPage from './pages/PlaceholderPage';
import RouteGuard from './components/RouteGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định khi vào trang web, hệ thống tự động chuyển sang trang /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 1. Các trang KHÔNG cần Sidebar & Header (Đứng độc lập) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Candidate application */}
        <Route path="/candidate" element={<RouteGuard roles={['CANDIDATE']}><CandidateLayout><CandidateDashboard /></CandidateLayout></RouteGuard>} />
        <Route path="/candidate/jobs" element={<RouteGuard roles={['CANDIDATE']}><CandidateLayout><CandidateJobs /></CandidateLayout></RouteGuard>} />
        <Route path="/candidate/jobs/:jobId" element={<RouteGuard roles={['CANDIDATE']}><CandidateLayout><CandidateJobDetail /></CandidateLayout></RouteGuard>} />
        <Route path="/candidate/applications" element={<RouteGuard roles={['CANDIDATE']}><CandidateLayout><CandidateApplications /></CandidateLayout></RouteGuard>} />
        <Route path="/candidate/applications/:applicationId" element={<RouteGuard roles={['CANDIDATE']}><CandidateLayout><CandidateApplicationDetail /></CandidateLayout></RouteGuard>} />
        <Route path="/candidate/interviews" element={<RouteGuard roles={['CANDIDATE']}><CandidateLayout><PlaceholderPage title="Interviews" description="Your scheduled interviews will appear here." /></CandidateLayout></RouteGuard>} />
        <Route path="/candidate/profile" element={<RouteGuard roles={['CANDIDATE']}><CandidateLayout><CandidateProfile /></CandidateLayout></RouteGuard>} />

        {/* Recruiter application */}
        <Route path="/recruiter" element={<RouteGuard roles={['RECRUITER']}><MainLayout><RecruiterDashboard /></MainLayout></RouteGuard>} />
        <Route path="/recruiter/jobs" element={<RouteGuard roles={['RECRUITER']}><MainLayout><JobList /></MainLayout></RouteGuard>} />
        <Route path="/recruiter/jobs/create" element={<RouteGuard roles={['RECRUITER']}><Navigate to="/recruiter?createJob=1" replace /></RouteGuard>} />
        <Route path="/recruiter/jobs/:jobId/candidates" element={<RouteGuard roles={['RECRUITER']}><MainLayout><AIRanking /></MainLayout></RouteGuard>} />
        <Route path="/recruiter/jobs/:jobId" element={<RouteGuard roles={['RECRUITER']}><MainLayout><PlaceholderPage title="Job details" description="Job details will be available here." /></MainLayout></RouteGuard>} />
        <Route path="/recruiter/candidates" element={<RouteGuard roles={['RECRUITER']}><MainLayout><PlaceholderPage title="Candidates" description="Candidate management will be available here." /></MainLayout></RouteGuard>} />
        <Route path="/recruiter/candidates/:candidateId" element={<RouteGuard roles={['RECRUITER']}><MainLayout><CandidateDetail /></MainLayout></RouteGuard>} />
        <Route path="/recruiter/pipeline" element={<RouteGuard roles={['RECRUITER']}><MainLayout><PlaceholderPage title="Pipeline" description="The recruitment pipeline will be available here." /></MainLayout></RouteGuard>} />
        <Route path="/recruiter/interviews" element={<RouteGuard roles={['RECRUITER']}><MainLayout><PlaceholderPage title="Interviews" description="Recruiter interviews will be available here." /></MainLayout></RouteGuard>} />

        {/* Admin application */}
        <Route path="/admin" element={<RouteGuard roles={['ADMIN']}><MainLayout><PlaceholderPage title="Admin dashboard" description="System metrics will be available here." /></MainLayout></RouteGuard>} />
        <Route path="/admin/users" element={<RouteGuard roles={['ADMIN']}><MainLayout><PlaceholderPage title="Users" description="User administration will be available here." /></MainLayout></RouteGuard>} />
        <Route path="/admin/jobs" element={<RouteGuard roles={['ADMIN']}><MainLayout><JobList /></MainLayout></RouteGuard>} />
        <Route path="/admin/settings" element={<RouteGuard roles={['ADMIN']}><MainLayout><PlaceholderPage title="Settings" description="System settings will be available here." /></MainLayout></RouteGuard>} />

        {/* Legacy links remain valid while callers move to the role-based paths. */}
        <Route path="/job/create" element={<Navigate to="/recruiter/jobs/create" replace />} />
        <Route path="/job/list" element={<Navigate to="/candidate/jobs" replace />} />
        <Route path="/dashboard/recruiter" element={<Navigate to="/recruiter" replace />} />
        <Route path="/dashboard/ranking/:jobId" element={<Navigate to="/recruiter/jobs" replace />} />
        <Route path="/candidate/ai" element={<Navigate to="/candidate" replace />} />
        <Route path="/candidate/detail/:userId" element={<Navigate to="/recruiter/candidates" replace />} />

        {/* 3. Trang 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;