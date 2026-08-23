import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../src/pages/Auth/Login';
import Register from '../src/pages/Auth/Register';
import CreateJob from '../src/pages/Job/CreateJob';
import JobList from '../src/pages/Job/JobList';
import RecruiterDashboard from '../src/pages/Job/RecruiterDashboard';
import MainLayout from '../src/components/Layouts/MainLayout'; 
import AIMatching from '../src/pages/Candidate/AIMatching';
import RouteGuard from '../src/components/RouteGuard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định khi vào trang web, hệ thống tự động đá sang trang /login */}
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
          path="/candidate/ai"
          element={
            <RouteGuard roles={['CANDIDATE']}>
              <MainLayout><AIMatching /></MainLayout>
            </RouteGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;