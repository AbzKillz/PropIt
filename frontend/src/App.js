import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import HomePage from "./components/HomePage";
import AuthPage from "./components/AuthPage";
import SearchPage from "./components/SearchPage";
import CreatePage from "./components/CreatePage";
import ProfilePage from "./components/ProfilePage";
import ActivityPage from "./components/ActivityPage";
import ProPage from "./components/ProPage";
import BottomNav from "./components/BottomNav";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9F7]">
        <div className="w-12 h-12 border-4 border-[#7B9681] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user === false) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout with Bottom Nav
const LayoutWithNav = ({ children }) => (
  <div className="min-h-screen pb-16">
    {children}
    <BottomNav />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      
      {/* Routes with Bottom Nav */}
      <Route path="/search" element={
        <LayoutWithNav>
          <SearchPage />
        </LayoutWithNav>
      } />
      
      {/* Protected Routes */}
      <Route path="/create" element={
        <ProtectedRoute>
          <LayoutWithNav>
            <CreatePage />
          </LayoutWithNav>
        </ProtectedRoute>
      } />
      
      <Route path="/activity" element={
        <ProtectedRoute>
          <ActivityPage />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      <Route path="/pro" element={
        <ProtectedRoute>
          <ProPage />
        </ProtectedRoute>
      } />

      <Route path="/payment/success" element={
        <ProtectedRoute>
          <ProPage />
        </ProtectedRoute>
      } />

      <Route path="/payment/cancel" element={
        <ProtectedRoute>
          <ProPage />
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
