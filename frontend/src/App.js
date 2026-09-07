import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import DashboardPage from './components/dashboard/DashboardPage';
import DocumentListPage from './components/documents/DocumentListPage';
import DocumentViewPage from './components/documents/DocumentViewPage';
import SharePage from './components/sharing/SharePage';
import PublicSharePage from './components/sharing/PublicSharePage';
import AuditLogPage from './components/audit/AuditLogPage';
import ProfilePage from './components/profile/ProfilePage';
import NotificationPage from './components/notifications/NotificationPage';
import AdminPage from './components/admin/AdminPage';
import OrganizationPage from './components/organization/OrganizationPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shared/:token" element={<PublicSharePage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentListPage /></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><DocumentViewPage /></ProtectedRoute>} />
      <Route path="/sharing" element={<ProtectedRoute><SharePage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/notification" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/organization" element={<ProtectedRoute><OrganizationPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;