import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ResourceListPage from './pages/ResourceListPage';

import AddResourcePage from './pages/AddResourcePage';
import EditResourcePage from './pages/EditResourcePage';
import ResourceDetailsPage from './pages/ResourceDetailsPage';

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
      </Routes>
    </Router>
  </React.StrictMode>,
);