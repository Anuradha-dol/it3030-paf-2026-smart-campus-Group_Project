import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import AddResourcePage from './pages/AddResourcePage';
import EditResourcePage from './pages/EditResourcePage';
import ResourceDetailsPage from './pages/ResourceDetailsPage';


import Login from './auth/auths/Login';
import Signup from './auth/auths/Signup';
import VerifyOtp from './auth/auths/VerifyOtp';
import OAuth2Success from './auth/auths/OAuth2Success';
import Dashboard from './auth/user/Dashboard';
import ForgotPassword from './auth/user/ForgotPassword';
import Home from './auth/user/Home';
import Profile from './auth/user/Profile';
import Settings from './auth/user/Settings';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/dashboard/resources/add" element={<AddResourcePage />} />
        <Route path="/dashboard/resources/edit/:id" element={<EditResourcePage />} />
        <Route path="/dashboard/resources/:id" element={<ResourceDetailsPage />} />

        <Route path="/resources" element={<Navigate to="/dashboard" replace />} />
        <Route path="/resources/add" element={<AddResourcePage />} />
        <Route path="/resources/edit/:id" element={<EditResourcePage />} />
        <Route path="/resources/:id" element={<ResourceDetailsPage />} />


          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth-success" element={<OAuth2Success />} />
          <Route path="/verify" element={<VerifyOtp />} />
          <Route path="/verify-email" element={<VerifyOtp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/home" element={<Home />} />
          <Route path="/techome" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  </React.StrictMode>,
);
