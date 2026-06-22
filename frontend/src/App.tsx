import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../src/pages/Auth/Login';
import Register from '../src/pages/Auth/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định khi vào trang web, hệ thống tự động đá sang trang /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Các tuyến đường dẫn trang chính */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;