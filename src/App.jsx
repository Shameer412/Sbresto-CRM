// App.js
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './app/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components/pages
import Login from './components/login/Login';
import Layout from './canvasser/layout/Layout';
import Profile from './canvasser/profile/Profile';
import LeadDetails from './canvasser/lead/LeadDetails';
import EditLead from './canvasser/lead/LeadEdit';
import Analytic from './canvasser/analytics/Analytic';
import LeadForm from './canvasser/lead/LeadForm';
import Lead from './canvasser/lead/Leads';
import FollowUpList from './canvasser/followUp/FollowUpList';
import Report from './canvasser/report/Report';
import Calender from './saleperson/Calender.jsx'
// Import ProtectedRoute
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        {/* Login page (no layout) */}
        <Route path="/login" element={<Login />} />

        {/* All dashboard pages inside Layout, PROTECTED */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="leads" />} />
          <Route path="profile" element={<Profile />} />
          <Route path="leads" element={<Lead />} />
          <Route path="leads/add" element={<LeadForm />} />
          <Route path="leads/:id" element={<LeadDetails />} />
          <Route path="leads/:id/edit" element={<EditLead />} />
          <Route path="analytics" element={<Analytic />} />
          <Route path="followup" element={<FollowUpList />} />
          <Route path="reports" element={<Report />} />
         
        </Route>

        {/* Fallback: any unknown route goes to login */}
        <Route path="*" element={<Navigate to="/login" />} />
       
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  </Provider>
);

export default App;
