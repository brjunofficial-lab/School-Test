import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import axios from 'axios';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import StudentDashboard from '@/pages/StudentDashboard';
import ParentDashboard from '@/pages/ParentDashboard';
import TeacherDashboard from '@/pages/TeacherDashboard';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import TakeTest from '@/pages/TakeTest';
import TestResults from '@/pages/TestResults';
import CreateTest from '@/pages/CreateTest';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (role && userRole !== role) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('userRole', res.data.role);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute role="student">
                <StudentDashboard user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/test/:testId" 
            element={
              <ProtectedRoute role="student">
                <TakeTest user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/results" 
            element={
              <ProtectedRoute role="student">
                <TestResults user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/parent/dashboard" 
            element={
              <ProtectedRoute role="parent">
                <ParentDashboard user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teacher/dashboard" 
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/create-test" 
            element={
              <ProtectedRoute role="teacher">
                <CreateTest user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute role="super_admin">
                <SuperAdminDashboard user={user} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;