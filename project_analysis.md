# Sbresto-CRM: Detailed Project Analysis

## 1. Introduction
Sbresto-CRM is a modern, feature-rich Customer Relationship Management (CRM) application built using the **React** ecosystem. It is designed to manage leads, territories, and schedules for different user roles including **Canvassers**, **Employees**, and **Admins**. The application leverages Google Maps for geographic tracking and territory management.

---

## 2. Technology Stack

### Core Framework & Build Tools
- **React (v18.2.0)**: The core library for building the user interface.
- **Vite (v5.0.0)**: A fast build tool and development server.
- **React Router Dom (v7.6.2)**: Handles client-side routing and navigation.

### State Management
- **Redux Toolkit**: Used for efficient and predictable state management across the app.
- **React Redux**: Connects React components with the Redux store.
- **Redux Persist**: Ensures state persistence across page reloads.

### Styling & UI/UX
- **Tailwind CSS (v3.4.1)**: Utility-first CSS framework for rapid and consistent styling.
- **Framer Motion**: Powering smooth animations and transitions.
- **Lucide React & Heroicons**: Modern and consistent icon sets.
- **React Toastify & React Hot Toast**: For real-time user notifications.

### Specialized Integrations
- **Google Maps API**:
  - `@react-google-maps/api`: React components for Google Maps.
  - `@googlemaps/markerclusterer`: For managing large sets of map markers.
- **Data Visualization**:
  - **Recharts**: For rendering analytics, stats, and reports.
- **Data Processing**:
  - **PapaParse**: CSV parsing and generation.
  - **XLSX**: Excel file processing.
- **Date/Time**:
  - **React Datepicker**: For scheduling and date selection.

### Infrastructure
- **Axios**: Promised-based HTTP client for API requests.
- **Vercel**: Configuration included for easy deployment.

---

## 3. Core Functionalities

### A. Authentication & General
- **Secure Login/Signup**: Role-based access control.
- **Protected Routes**: Ensures only authorized users can access specific dashboards.
- **Responsive Layouts**: Sidebars and headers tailored to each user role.

### B. Canvasser Dashboard
- **Lead Management**: Complete lifecycle of leads (Add, Edit, View Details, List).
- **Territory Management**:
  - **Create Territory**: Define geographic boundaries on a map.
  - **Prospect View**: Strategic view of potential leads in a territory.
- **Analytics & Reports**: Visual representation of canvassing performance.
- **Scheduling**: Calendar view and meeting management for field activities.

### C. Employee Dashboard
- **Activity Stats**: Real-time dashboard for individual performance.
- **Lead Collaboration**: Notes system for internal communication on specific leads.
- **Mapping**: Integrated map view for territory assignments.
- **Meeting Management**: Integrated calendar for scheduling and tracking meetings.

### D. Admin & Specialized Dashboards
- **Global Overview**: High-level stats and management tools.
- **Map Export**: Ability to create and export routes or territory data.
- **Political Dashboard**: Specialized module for demographic or regional tracking.
- **Survey System**: Tools to create and manage surveys for data collection.

---

## 4. Project Architecture
The project follows a modular directory structure based on user roles and features:

```text
src/
├── app/            # Redux store configuration
├── features/       # Redux slices (auth, leads, etc.)
├── components/     # Shared UI components (Login, ProtectedRoute)
├── canvasser/      # Canvasser-specific features & layout
├── employee/       # Employee-specific features & layout
├── saleperson/     # Sales management modules
├── part2/          # Admin and specialized dashboards
└── assets/         # Static images and styles
```

---

## 5. Summary
Sbresto-CRM is a highly integrated platform that combines traditional CRM features with advanced mapping and data visualization tools. Its use of modern technologies like Vite, Tailwind, and Redux ensures a performant and scalable codebase suitable for real-time business operations.
