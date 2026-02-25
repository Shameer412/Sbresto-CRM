<div align="center">

<h1>⚡ Sbresto CRM</h1>

<p><strong>Enterprise-grade, role-based CRM platform for field sales teams</strong><br/>
Territory mapping · Lead lifecycle · Insurance tracking · Real-time scheduling · Analytics & exports</p>

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.8-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Maps](https://img.shields.io/badge/Google_Maps_API-Integrated-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Application Architecture](#-application-architecture)
- [Module Deep Dive](#-module-deep-dive)
  - [Authentication & RBAC](#1-authentication--role-based-access-control)
  - [Lead Management](#2-lead-management--6-step-wizard)
  - [Territory & Map System](#3-territory--google-maps-system)
  - [Scheduling & Calendar](#4-scheduling--calendar)
  - [Analytics & Reporting](#5-analytics--reporting)
  - [Admin & Political Dashboard](#6-admin--political-dashboard)
  - [Survey System](#7-survey-system)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Integration](#-api-integration)
- [Contributing](#-contributing)

---

## 🎯 Overview

**Sbresto CRM** is a production-ready, single-page application built for field sales teams in the roofing and property damage inspection industry. The platform handles the entire customer acquisition pipeline — from capturing storm-damage leads in the field, drawing geographic territories on a live satellite map, booking inspection appointments, tracking insurance claims, and generating exportable performance reports.

The app is architected around **three distinct user roles** (Canvasser, Employee, Admin), each with its own dashboard, routing, and feature set, all backed by a shared Redux state layer and a REST API.

> 🏗️ **Domain:** Roofing / Property damage claim CRM
> 👥 **Users:** Field canvassers, office employees, admins
> 🌍 **Region:** US (Houston, TX area, with geo-bounds enforcement)

---

## 🔗 Live Demo

> 🚀 **[View Live on Vercel →](https://sbresto-crm.vercel.app)**

---

## ✨ Core Features

### 🔐 Authentication & Security
- JWT-based token authentication
- Dynamic invite-link registration (`/register/:token`)
- Protected routes via `ProtectedRoute` HOC — unauthenticated users redirected to login
- Role-based dashboard routing (canvasser / employee / admin)
- State persistence across page reloads via **Redux Persist**

### 📋 Lead Management (Full Lifecycle)
- **6-step guided form wizard**: Personal → Property → Insurance → Roof Specs → Management → Notes
- Real-time form validation with field-level error messages
- Lead fields: name, email, phone, property address, ZIP, damage type, storm date, insurance provider, claim number, insurer status, roof age/type, source, priority (`Low/Medium/High/Urgent`), status, assigned user, inspection date, follow-up date, retail bid request, and notes
- Inline **meeting slot booking** — pick an assignee, choose a date, then select from live available time slots fetched from the API
- Lead list with search, filter, and pagination
- Full lead detail view with edit functionality
- Follow-up list with scheduled reminder tracking

### 🗺️ Territory & Google Maps System
**(Most technically complex module)**
- Full **Google Maps API** integration with satellite, hybrid, roadmap, and terrain views
- **Polygon mode**: Freehand draw territory boundaries using Google Maps `DrawingManager` — polygons store as **GeoJSON** format
- **Radius mode**: Click a point on the map, set radius in km — renders a live `Circle` overlay
- **Reverse geocoding**: Auto-detects and suggests territory name from drawn area using Google Geocoder API
- **Places Autocomplete search**: Search any US location, restricted to South-Central bounds
- Custom territory color picker per territory
- Assign territory to a specific team member on save
- HD satellite mode toggle (tilt effect)
- Custom map controls: zoom in/out, compass reset
- Territory list view with edit/update capability via `UpdateTerritoryModel`
- **Itinerary Viewer Modal**: View scheduled routes and activities per territory
- **Prospect View**: Visualize potential leads geographically within territory boundaries

### 📅 Scheduling & Calendar
- Full calendar view with month/week navigation
- Create/manage scheduled meetings and field visits
- Real-time **available slot fetching** per user per day
- Meeting list with status tracking
- Separate schedule board layout for sales persons

### 📊 Analytics & Reporting
- Interactive **Recharts** visualizations: bar charts, line charts, area charts
- Canvasser performance analytics (leads closed, follow-ups, conversion rates)
- Employee stats dashboard
- Exportable reports:
  - **CSV export** via PapaParse
  - **Excel export** via XLSX
- Map export module for routes/territories

### 🏛️ Admin Dashboard
- Global overview of all team activities
- Full territory and lead management controls
- Map-based route export tool
- User management and territory assignment

### 🗳️ Political / Demographic Dashboard
- Specialized dashboard module for regional/demographic tracking
- Separate layout and navigation

### 📝 Survey System
- Survey builder and form renderer
- `Survey.jsx` + `SurveyForm.jsx` modules
- Data collection for field agents

### 💬 Internal Notes & Collaboration
- Per-lead notes system for asynchronous team communication
- Employee notes module for internal updates

---

## 🛠️ Tech Stack

| Category | Library / Tool | Purpose |
|---|---|---|
| **UI Framework** | React 18.2 | Component-based SPA |
| **Build Tool** | Vite 5.0 | Dev server & production bundler |
| **Routing** | React Router DOM v7 | Client-side multi-role routing |
| **State** | Redux Toolkit + React Redux | Centralized predictable state |
| **Persistence** | Redux Persist | State survival across reloads |
| **API** | Axios | HTTP client with interceptors |
| **RTK Query** | Redux Toolkit Query | API slice caching + mutations |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **Animations** | Framer Motion | Page transitions & micro-animations |
| **Maps** | @react-google-maps/api | React-wrapped Google Maps |
| **Drawing** | Google Maps DrawingManager | Polygon/shape drawing on map |
| **Clustering** | @googlemaps/markerclusterer | Performance clustering for map markers |
| **Charts** | Recharts | Analytics data visualization |
| **Date Picker** | React Datepicker | Calendar inputs for lead forms |
| **CSV Export** | PapaParse | Parse & generate CSV files |
| **Excel Export** | XLSX | Generate Excel spreadsheets |
| **Drag & Drop** | DnD Kit + React Beautiful DnD | Sortable UI lists |
| **Notifications** | React Toastify + React Hot Toast | Real-time user feedback |
| **Icons** | Lucide React + Heroicons + React Icons | Consistent icon system |
| **Command Menu** | cmdk | Keyboard-accessible command palette |
| **Spinners** | React Spinners | Loading state indicators |
| **Deployment** | Vercel | Zero-config hosting |

---

## 🏗️ Application Architecture

### Routing Design

```
/login                       → Login page
/register/:token             → Invite-based signup

/* (Protected)               → Canvasser Dashboard
  /leads                     → Lead list
  /leads/add                 → 6-step lead creation wizard
  /leads/:id                 → Lead detail view
  /leads/:id/edit            → Edit lead
  /analytics                 → Performance analytics
  /followup                  → Follow-up list
  /reports                   → Reports + export
  /calender                  → Calendar view
  /schedule1                 → Schedule board
  /createterritory           → Draw territory on Google Maps
  /territories               → Territory list
  /prospectview              → Geo prospect view

/employee/* (Protected)      → Employee Dashboard
  /employee/dashboard        → Stats & KPIs
  /employee/leadlist         → Lead collaboration
  /employee/notes            → Internal notes
  /employee/stats            → Analytics
  /employee/followup/list    → Follow-up tracker
  /employee/meeting/calender → Calendar
  /employee/meeting/schedule → Schedule view
  /employee/meeting/list     → Meeting list
  /employee/territory/list   → Territory map

/admin                       → Admin Dashboard
/map-export                  → Route/territory export
/political-dashboard         → Political/demographic module
/survey                      → Survey viewer
/survey-form                 → Survey form
/schedule                    → Salesperson schedule
```

### State Management Pattern

```
Redux Store
├── features/
│   ├── auth/          authSlice.js    → login, token, user role
│   ├── leads/         leadsApiSlice.js → RTK Query CRUD
│   ├── territory/     TerritoryApiSlice.js → RTK Query (create/list/update)
│   └── calender/      scheduleApiSlice.js → slot fetching, meeting booking
└── Redux Persist      → persists auth + user state to localStorage
```

---

## 🔬 Module Deep Dive

### 1. Authentication & Role-Based Access Control

- Login submits credentials → receives JWT token → stored in Redux (persisted)
- `ProtectedRoute` wraps all role-specific routes — unauthenticated users are redirected to `/login`
- Dynamic signup via invite token: `/register/:token` — prevents unauthorized registrations
- Role is extracted from token/response and determines which dashboard layout is rendered

---

### 2. Lead Management — 6-Step Wizard

The lead creation form is a fully validated, multi-step wizard:

| Step | Fields |
|---|---|
| **1. Personal** | Full name ✱, Email ✱, Phone ✱ |
| **2. Property** | Address, ZIP code, Damage type (Roof/Siding/Windows/Flood/Other), Storm date |
| **3. Insurance** | Provider name, Claim number, Insured status (Yes/No) |
| **4. Roof Specs** | Age of roof (years), Type of roof (Asphalt/Metal/etc.) |
| **5. Management** | Lead source, Status, Priority (Low/Medium/High/Urgent), Assign to user, Retail bid request, Appointment date, Follow-up date — plus **live meeting slot booking** |
| **6. Notes** | Freehand notes ✱ |

**Meeting Slot Booking** (Step 5):
1. Select an assignee from dropdown
2. Meeting date picker appears
3. Available time slots are fetched live from API for that user+date
4. Select a slot → on form submit, meeting is booked simultaneously with lead creation

All form data is sent as a structured API payload. Mutations use **RTK Query** (`useCreateLeadMutation`, `useBookLeadMeetingMutation`).

---

### 3. Territory & Google Maps System

```
Map Modes:    Roadmap | Hybrid (default) | Satellite | Terrain
Draw Modes:   Polygon | Radius Circle
```

**Polygon Flow:**
1. User clicks "Draw" → `DrawingManager` activates
2. User draws freehand polygon on map
3. On completion → Google Geocoder auto-detects location name for territory
4. Drawn points converted to **GeoJSON Polygon** format for API storage
5. Save panel opens → name, color, assigned user → POST to API

**Radius Flow:**
1. User sets radius in km
2. Clicks "Select Center" → map click handler activates
3. User clicks map point within South-Central US bounds
4. Live `Circle` overlay renders at specified radius
5. Geocoder detects location name → save panel → POST to API

**Additional Map Features:**
- Location search with Google Places Autocomplete (restricted to US)
- Custom zoom controls + compass reset
- HD/tilt mode toggle
- Territory color customization
- Territory list with inline editing and itinerary viewer

---

### 4. Scheduling & Calendar

- Calendar uses month/week views for field scheduling
- `scheduleApiSlice` provides RTK Query hooks for:
  - `useGetAvailableLeadSlotsQuery` — fetches free timeslots per user per date
  - `useBookLeadMeetingMutation` — books a meeting tied to a lead
- Meeting list shows scheduled meetings with status
- Separate schedule board layout for Salesperson role

---

### 5. Analytics & Reporting

- **Recharts** renders interactive charts for canvasser/employee performance
- Metrics tracked: leads created, follow-ups scheduled, conversions, territory coverage
- Reports page allows:
  - Date range filtering
  - CSV download (`PapaParse`)
  - Excel export (`XLSX`)
- Admin can export full route/territory maps

---

### 6. Admin & Political Dashboard

- **Admin Dashboard** (`/admin`): High-level management overview, all team leads and territories
- **Map Export** (`/map-export`): Generate exportable field routes from map data
- **Political Dashboard** (`/political-dashboard`): Regional/demographic data visualization for specialized sales verticals

---

### 7. Survey System

- **Survey Viewer** (`/survey`): Renders existing surveys
- **Survey Form** (`/survey-form`): Data collection form for field agents to fill out at prospect locations

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and npm
- **Google Cloud API Key** with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Drawing Library

### Installation

```bash
# Clone the repository
git clone https://github.com/Shameer412/Sbresto-CRM.git
cd Sbresto-CRM

# Install all dependencies
npm install

# Configure environment
cp .env.example .env
# → Fill in your keys (see below)

# Start development server
npm run dev
```

App runs at `http://localhost:5173`

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# Google Maps API (required for all map features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend REST API base URL
VITE_API_BASE_URL=https://your-backend-api.com/api
```

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

---

## 📁 Project Structure

```
sbresto-crm/
├── public/
├── src/
│   ├── app/
│   │   └── store.js                  # Redux store + Redux Persist config
│   │
│   ├── features/                     # RTK Query API slices
│   │   ├── auth/                     # Auth state slice
│   │   ├── leads/                    # leadsApiSlice (CRUD + statuses/sources/users)
│   │   ├── territory/                # TerritoryApiSlice (create/list/update itinerary)
│   │   └── calender/                 # scheduleApiSlice (slots + meeting booking)
│   │
│   ├── components/                   # Shared components
│   │   ├── login/Login.jsx           # Login page
│   │   ├── SignUp.jsx                # Invite-based registration
│   │   └── ProtectedRoute.jsx        # Auth guard HOC
│   │
│   ├── canvasser/                    # 🟢 CANVASSER ROLE
│   │   ├── layout/                   # Sidebar + header layout
│   │   ├── lead/                     # LeadForm (6-step), LeadDetails, LeadEdit, Leads list
│   │   ├── territory/                # CreateTerritory, TerritoryList, ProspectView,
│   │   │                             #   UpdateTerritoryModel, ItineraryViewerModal
│   │   ├── analytics/                # Recharts analytics dashboard
│   │   ├── calender/                 # Calendar view + Schedule board
│   │   ├── followUp/                 # Follow-up list + management
│   │   ├── notes/                    # Lead notes system
│   │   ├── notification/             # Notification panel
│   │   ├── profile/                  # User profile
│   │   └── report/                   # Reports + CSV/Excel export
│   │
│   ├── employee/                     # 🔵 EMPLOYEE ROLE
│   │   ├── dashboard/                # Employee layout
│   │   ├── stats/                    # Dashboard KPIs + Analytics
│   │   ├── leads/                    # Lead CRUD (employee perspective)
│   │   ├── calender/                 # Calendar, Schedule, Meeting list
│   │   ├── followup/                 # Follow-up tracker
│   │   ├── map/                      # Territory list (map view)
│   │   ├── notes/                    # Internal notes
│   │   └── profile/                  # Employee profile
│   │
│   ├── part2/                        # 🔴 ADMIN & SPECIALIZED
│   │   ├── admin/
│   │   │   ├── dashboard/            # Admin overview layout
│   │   │   └── map/                  # CreateRoute (map export)
│   │   ├── employees/
│   │   │   └── layout/               # Political dashboard layout
│   │   └── test/
│   │       ├── Survey.jsx            # Survey viewer
│   │       └── SurveyForm.jsx        # Survey form
│   │
│   ├── saleperson/                   # 🟡 SALESPERSON
│   │   └── dashboard/                # Schedule board layout
│   │
│   ├── App.jsx                       # Root: Provider + BrowserRouter + LoadScript
│   ├── main.jsx                      # ReactDOM render entry point
│   └── index.css                     # Global styles
│
├── vercel.json                       # Vercel SPA routing config
├── tailwind.config.cjs               # Tailwind configuration
├── postcss.config.cjs                # PostCSS plugins
├── vite.config.js                    # Vite build config
└── package.json
```

---

## 🔌 API Integration

All API communication is handled via **RTK Query** API slices using `Axios` as the base query. The API layer features:

- **Automatic caching** — RTK Query caches responses and invalidates on mutations
- **Optimistic updates** — UI updates immediately, reverted on failure
- **Loading states** — `isLoading`, `isFetching`, `isError` flags per query
- **Mutation hooks** — `useCreateLeadMutation`, `useBookLeadMeetingMutation`, `useCreateItineraryItemMutation`, etc.
- **Tag-based invalidation** — cache is cleared automatically after create/update mutations

Key API slices:

| Slice | Hooks |
|---|---|
| `leadsApiSlice` | `useGetLeadsQuery`, `useCreateLeadMutation`, `useUpdateLeadMutation`, `useGetLeadStatusesQuery`, `useGetLeadSourcesQuery`, `useGetLeadUsersQuery` |
| `TerritoryApiSlice` | `useCreateItineraryItemMutation`, `useGetTerritoriesQuery`, `useUpdateTerritoryMutation` |
| `scheduleApiSlice` | `useGetAvailableLeadSlotsQuery`, `useBookLeadMeetingMutation` |

---

## ☁️ Deployment

Pre-configured for **Vercel** via `vercel.json` (SPA fallback routing):

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

Add these to Vercel Environment Variables:
```
VITE_GOOGLE_MAPS_API_KEY=...
VITE_API_BASE_URL=...
```

For production builds locally:
```bash
npm run build    # Outputs to /dist
npm run preview  # Preview the production build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

**Commit message convention:** `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using React 18, Vite 5, Redux Toolkit & Google Maps API**

⭐ If this project helped you, consider giving it a star!

</div>
