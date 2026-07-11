import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import App from './App.tsx';
import { Landing } from './pages/Landing.tsx';
import { DocumentationPage } from './pages/DocumentationPage.tsx';
import { Login } from './pages/Login.tsx';
import { Patients } from './pages/Patients.tsx';
import { PatientDetail } from './pages/PatientDetail.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Admin } from './pages/Admin.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './lib/AuthContext';
import { ActivePatientProvider } from './lib/ActivePatientContext';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ActivePatientProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/docs" element={<DocumentationPage />} />
                <Route path="/app" element={<ProtectedRoute><App /></ProtectedRoute>} />
                <Route path="/patients" element={<ProtectedRoute permission="patients:read"><Patients /></ProtectedRoute>} />
                <Route path="/patients/:id" element={<ProtectedRoute permission="patients:read"><PatientDetail /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute permission="exams:read"><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute permission="users:manage"><Admin /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ActivePatientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
