import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './app/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/login/Login';
import SignUp from "./components/SignUp.jsx"
import Layout from './canvasser/layout/Layout';
import Profile from './canvasser/profile/Profile';
import LeadDetails from './canvasser/lead/LeadDetails';
import EditLead from './canvasser/lead/LeadEdit';
import Analytic from './canvasser/analytics/Analytic';
import LeadForm from './canvasser/lead/LeadForm';
import Lead from './canvasser/lead/Leads';
import FollowUpList from './canvasser/followUp/FollowUpList';
import Report from './canvasser/report/Report';
import Schedule from './saleperson/dashboard/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Calender from './canvasser/calender/Calender.jsx'
import Schedule1 from './canvasser/calender/Schedule.jsx'
import CreateTerritory from './canvasser/territory/CreateTerritory';
import TerritoryList from './canvasser/territory/TerritoryList.jsx';
const AppRoutes = () => {


  return (
    <Routes>
     <Route path="/register/:token" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
     
       <Route
    path="/schedule"
    element={
      <ProtectedRoute>
        <Schedule />
      </ProtectedRoute>
    }
  />
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
          <Route path="calender" element={<Calender />} />
            <Route path="schedule1" element={<Schedule1 />} />
          <Route path="/createterritory" element={<CreateTerritory />} />
           <Route path="/territories" element={<TerritoryList />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  </Provider>
);

export default App;
