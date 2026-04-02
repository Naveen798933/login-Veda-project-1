import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssVarsProvider, CssBaseline } from '@mui/joy';
import { useAuthStore } from './store/authStore';
import OfflineDetection from './components/OfflineDetection';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import DocumentDetail from './pages/DocumentDetail';
import AuthTest from './pages/AuthTest';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <CssVarsProvider defaultMode="dark">
        <CssBaseline />
        <OfflineDetection />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth-test" element={<AuthTest />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/document/:id" 
            element={
              <ProtectedRoute>
                <DocumentDetail />
              </ProtectedRoute>
            } 
          />
          {/* Catch all redirect to Dashboard/Login */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </CssVarsProvider>
    </Router>
  );
}

export default App;
