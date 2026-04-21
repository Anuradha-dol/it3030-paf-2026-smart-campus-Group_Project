import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ResourceListPage from './pages/ResourceListPage';

import AddResourcePage from './pages/AddResourcePage';
import EditResourcePage from './pages/EditResourcePage';
import ResourceDetailsPage from './pages/ResourceDetailsPage';


import Login from './auth/auths/Login';
import Signup from './auth/auths/Signup';
import VerifyOtp from './auth/auths/VerifyOtp';
import Dashboard from './auth/user/Dashboard';
import ForgotPassword from './auth/user/ForgotPassword';
import Home from './auth/user/Home';
import Profile from './auth/user/Profile';
import Settings from './auth/user/Settings';


import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/resources" />} />
        <Route path="/resources" element={<ResourceListPage />} />
        <Route path="/resources/add" element={<AddResourcePage />} />
        <Route path="/resources/edit/:id" element={<EditResourcePage />} />
        <Route path="/resources/:id" element={<ResourceDetailsPage />} />


         <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
