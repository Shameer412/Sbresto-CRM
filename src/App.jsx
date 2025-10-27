
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import { store } from './app/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/login/Login';
import SignUp from './components/SignUp.jsx';
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
import Calender from './canvasser/calender/Calender.jsx';
import Schedule1 from './canvasser/calender/Schedule.jsx';
import CreateTerritory from './canvasser/territory/CreateTerritory';
import TerritoryList from './canvasser/territory/TerritoryList.jsx';
import ProspectView from './canvasser/territory/ProspectView.jsx';

// Employee Dashboard Components
import EmployeeLayout from './employee/dashboard/Layout';
import EmployeeDashboard from './employee/stats/Dashboard';
import EmployeeLeadList from './employee/leads/LeadList';
import EmployeeLeadForm from './employee/leads/LeadForm';
import EmployeeLeadDetails from './employee/leads/LeadDetails';
import EmployeeEditLead from './employee/leads/LeadEdit';
import EmployeeNotes from './employee/notes/Notes';
import EmployeeStats from './employee/stats/Analytics.jsx';
import EmployeeFollowUpList from './employee/followup/FollowUpList.jsx';
import EmployeeProfile from './employee/profile/Profile.jsx';
import EmployeeCalender from './employee/calender/Calender.jsx';
import EmployeeSchedule from './employee/calender/Schedule.jsx';
import EmployeeTerritoryList from './employee/map/TerritoryList.jsx';
import EmployeeMeetinglist from './employee/calender/MeetingList.jsx';

// Part2 Admin Dashboard Components
import AdminDashboard from './part2/admin/dashboard/Layout';
import MapExport from './part2/admin/map/CreateRoute';

// Part2 Employee Dashboard Components
import PoliticalDashboard from './part2/employees/layout/Layout';
// Test Components
import Survey from './part2/test/Survey.jsx';
import SurveyForm from './part2/test/SurveyForm.jsx';



// Static libraries array to prevent reload
const LIBRARIES = ['drawing', 'places', 'geometry'];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/survey" element={<Survey />} />
      <Route path="/survey-form" element={<SurveyForm />} />
      <Route path="/map-export" element={<MapExport />} />
      <Route path="/admin" element={<AdminDashboard />} />
       <Route path="/political-dashboard" element={<PoliticalDashboard />} />
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
      {/* Canvasser Dashboard Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="leads" />} />
        <Route path="leads" element={<Lead />} />
        <Route path="leads/add" element={<LeadForm />} />
        <Route path="leads/:id" element={<LeadDetails />} />
        <Route path="leads/:id/edit" element={<EditLead />} />
        <Route path="profile" element={<Profile />} />
        <Route path="analytics" element={<Analytic />} />
        <Route path="followup" element={<FollowUpList />} />
        <Route path="reports" element={<Report />} />
        <Route path="calender" element={<Calender />} />
        <Route path="schedule1" element={<Schedule1 />} />
        <Route path="createterritory" element={<CreateTerritory />} />
        <Route path="territories" element={<TerritoryList />} />
        <Route path="prospectview" element={<ProspectView />} />
      </Route>
      {/* Employee Dashboard Routes */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="leadlist" element={<EmployeeLeadList />} />
        <Route path="leadlist/add" element={<EmployeeLeadForm />} />
        <Route path="leadlist/:id" element={<EmployeeLeadDetails />} />
        <Route path="leadlist/:id/edit" element={<EmployeeEditLead />} />
        <Route path="notes" element={<EmployeeNotes />} />
        <Route path="followup/list" element={<EmployeeFollowUpList />} />
        <Route path="stats" element={<EmployeeStats />} />
        <Route path="profile/view" element={<EmployeeProfile />} />
        <Route path="meeting/calender" element={<EmployeeCalender />} />
        <Route path="meeting/schedule" element={<EmployeeSchedule />} />
        <Route path="territory/list" element={<EmployeeTerritoryList />} />
        <Route path="meeting/list" element={<EmployeeMeetinglist />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
      {/* Admin Dashboard Route */}
      <Route path="/admin  " element={<AdminDashboard />} /> 
    </Routes>

  );
};

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={LIBRARIES}
        version="weekly"
        language="en"
        region="US"
        id="google-map-script"
      >
        <AppRoutes />
        <ToastContainer />
      </LoadScript>
    </BrowserRouter>
  </Provider>
);

export default App;
