import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CreateJob from './pages/Job/CreateJob';
import JobList from './pages/Job/JobList';
import RecruiterDashboard from './pages/Job/RecruiterDashboard';
import MainLayout from './components/Layouts/MainLayout'; 
import AIMatching from './pages/Candidate/AIMatching';
import CandidateProfile from './pages/Candidate/CandidateProfile';
import CandidateDetail from './pages/Candidate/CandidateDetail';
import AIRanking from './pages/Job/AIRanking';
import NotFound from './pages/NotFound';
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

        {/* 2. Các trang nghiệp vụ hệ thống CẦN Sidebar & Header (Bọc kín bằng MainLayout) */}
        <Route 
          path="/job/create" 
          element={
            <RouteGuard roles={['RECRUITER', 'ADMIN']}>
              <MainLayout><CreateJob /></MainLayout>
            </RouteGuard>
          } 
        />
        
        <Route 
          path="/job/list" 
          element={
            <RouteGuard roles={['CANDIDATE', 'RECRUITER', 'ADMIN']}>
              <MainLayout><JobList /></MainLayout>
            </RouteGuard>
          } 
        />
        
        <Route 
          path="/dashboard/recruiter" 
          element={
            <RouteGuard roles={['RECRUITER', 'MANAGER', 'ADMIN']}>
              <MainLayout><RecruiterDashboard /></MainLayout>
            </RouteGuard>
          } 
        />

        <Route 
          path="/dashboard/ranking/:jobId" 
          element={
            <RouteGuard roles={['RECRUITER', 'MANAGER', 'ADMIN']}>
              <MainLayout><AIRanking /></MainLayout>
            </RouteGuard>
          } 
        />

        <Route
          path="/candidate/ai"
          element={
            <RouteGuard roles={['CANDIDATE']}>
              <MainLayout><AIMatching /></MainLayout>
            </RouteGuard>
          }
        />

        <Route
          path="/candidate/profile"
          element={
            <RouteGuard roles={['CANDIDATE']}>
              <MainLayout><CandidateProfile /></MainLayout>
            </RouteGuard>
          }
        />

        <Route
          path="/candidate/detail/:userId"
          element={
            <RouteGuard roles={['RECRUITER', 'MANAGER', 'ADMIN']}>
              <MainLayout><CandidateDetail /></MainLayout>
            </RouteGuard>
          }
        />

        {/* 3. Trang 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;