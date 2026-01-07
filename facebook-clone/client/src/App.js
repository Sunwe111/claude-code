import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './components/Common/MainLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Pages from './pages/Pages';
import PageDetail from './pages/PageDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Marketplace from './pages/Marketplace';
import ListingDetail from './pages/ListingDetail';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Settings from './pages/Settings';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Public Route Component (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><MainLayout><Home /></MainLayout></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><MainLayout><Friends /></MainLayout></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MainLayout noSidebar><Messages /></MainLayout></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><MainLayout noSidebar><Messages /></MainLayout></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><MainLayout><Groups /></MainLayout></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><MainLayout><GroupDetail /></MainLayout></ProtectedRoute>} />
        <Route path="/pages" element={<ProtectedRoute><MainLayout><Pages /></MainLayout></ProtectedRoute>} />
        <Route path="/pages/:id" element={<ProtectedRoute><MainLayout><PageDetail /></MainLayout></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><MainLayout><Events /></MainLayout></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><MainLayout><EventDetail /></MainLayout></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><MainLayout><Marketplace /></MainLayout></ProtectedRoute>} />
        <Route path="/marketplace/:id" element={<ProtectedRoute><MainLayout><ListingDetail /></MainLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><MainLayout><Notifications /></MainLayout></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><MainLayout><Search /></MainLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
