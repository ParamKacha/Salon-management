# Luxe Salon Management System — Architectural Documentation & Demonstration Guide

**Darshan University — B.Tech (CSE) / B.Sc (H) Semester 5**  
**Subject:** Advanced Frontend Web Technology (2501CS401)  
**Deliverable:** Complete Architectural Documentation & Final System Presentation Guide  

---

## 1. Executive System Overview

The Luxe Salon Management System is a modern, responsive Single Page Application (SPA) designed to streamline salon reservations, inventory tracking, staff scheduling, e-commerce retail, and business intelligence analytics. The project features an elegant, professional brown-and-white visual identity with real-time operational feedback.

### Technology Stack
- **Frontend Architecture:** React 19, React Router v7, Material UI (MUI) v9, Recharts v3, Axios.
- **Backend Architecture:** Node.js, Express.js REST API, JSON Web Tokens (JWT), Mongoose ODM.
- **Database:** MongoDB Atlas (Cloud NoSQL).
- **Deployment Strategy:** Vercel (Frontend SPA with edge routing rules) & Node.js Hosting (Render / Railway / VPS).

---

## 2. System Architecture & Component Hierarchy

```
                                  ┌────────────────────────┐
                                  │      Client (SPA)      │
                                  │ React 19 + MUI + Vite  │
                                  └───────────┬────────────┘
                                              │ Axios Interceptor
                                              │ (Bearer JWT)
                                              ▼
                                  ┌────────────────────────┐
                                  │ Express REST API (5001)│
                                  ├────────────────────────┤
                                  │  JWT Auth Middleware   │
                                  │  Role-Based Access Ctrl│
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
             ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
             │ Users & Staff   │     │ Appointments    │     │ Inventory &     │
             │ Collection      │     │ Collection      │     │ Products Store  │
             └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Route & Component Splitting
Dynamic route loading (`React.lazy` + `<Suspense>`) breaks monolithic bundles into independently loaded chunks:
- `vendor-react`: Core React runtime & router (`~70 kB gzip`)
- `vendor-mui`: Material UI design tokens and components (`~108 kB gzip`)
- `vendor-charts`: Recharts charting engine (`~117 kB gzip`, dynamically loaded on `/analytics`)
- **Page Chunks:** 2 kB to 16 kB per view, ensuring initial page load times under 1 second.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Portal Feature | Admin | Receptionist | Barber | Customer |
| :--- | :---: | :---: | :---: | :---: |
| **Executive Overview / Dashboard** | Full System KPI | Operational Grid | Personal Commission | Booking Log |
| **Interactive Service Discovery** | Manage & Edit | View & Filter | View | Browse & Book |
| **Booking Wizard (Slot Grid)** | Admin Booking | Walk-in Booking | — | Online Booking |
| **Staff & Time-Off Management** | Full CRUD | View & Filter | Request Leave | — |
| **Reservation Master Grid** | Full Status Control | Fast Status Control | Update Assigned | Cancel / Reschedule |
| **Inventory Stock Control** | Full Control + Restock| View Ledger | — | — |
| **Product Retail Store** | Manage Catalog | View Products | — | Add to Cart & Checkout |
| **BI Analytics & Recharts** | Full Analytics | — | Personal Performance| — |
| **Profile Configuration** | Account Config | Account Config | Bio & Shift Info | Order & Visit History |

---

## 4. Week-by-Week Implementation Summary

### Week 1–3: Core Foundation & Secure Authentication
- Centralized Axios instance with automatic `Authorization: Bearer <token>` injection.
- Synchronous React Context API Auth Provider eliminating refresh flashes.
- Role-specific Dashboard hubs with styled brown-white theme and custom brand logo.

### Week 4: Interactive Service Discovery (`Services.jsx`)
- Price range boundaries (Min/Max inputs hitting backend query params).
- Category grouping divider bars with service count chips.
- Duration filtering options and client-side sorting (price, duration).

### Week 5: Validated Booking Wizard (`BookAppointment.jsx`)
- Interactive 30-minute time slot grid.
- Visual state differentiation: Active slots (brand brown) vs. Booked slots (greyed out with `not-allowed` cursor).
- Real-time slot availability lookup based on barber working hours and existing appointments.

### Week 6: Customer Hub & Account Management (`Profile.jsx`)
- 4 real-time metric cards (Upcoming Visits, Completed Sessions, Total Spend, Favorite Services).
- Direct backend hook into `PUT /auth/profile` and `PUT /auth/change-password`.
- Historical visit summary log and upcoming reservation trackers.

### Week 7: Staff Management & Stylist Directory (`Staff.jsx`)
- Multi-select skill tag filtering chips (e.g., Haircut, Beard Styling, Facial).
- Visual employee rows showing daily shift hours, working day badges, and experience stars.
- Biography inspection dialog with individual performance metrics and leave management tabs.

### Week 8: Reservation Master Grid (`Appointments.jsx`)
- Executive reservation statistics (Total Loaded, Pending, Confirmed, Completed).
- In-grid inline dropdown control allowing receptionists to transition appointment states instantly.
- Barber filtering panel and integrated cancellation/reschedule workflows.

### Week 9: Inventory Ledger & Stock Control (`Inventory.jsx`)
- Product ledger with stock volume balance tracking (e.g., Shampoo, Hair Wax, Hair Color).
- Dynamic low-stock threshold warning banner flagging critical supply levels.
- Visual `LinearProgress` gauge bars highlighting deficient items in soft red.

### Week 10: E-Commerce Product Store & Cart Drawer (`Products.jsx`)
- Persistent slide-out shopping cart drawer with inline quantity adjusters (`+` / `-`).
- Checkout calculation engine computing subtotal, 18% GST tax, and grand total in real time.
- State handled cleanly through React component state without external boilerplate.

### Week 11: Business Intelligence & Recharts (`Analytics.jsx`)
- **AreaChart:** Multi-gradient sales curves mapping appointment and product revenue over time.
- **LineChart:** Customer acquisition and conversion trajectory curves.
- **ComposedChart:** Multi-axis employee performance analysis comparing completed services against revenue.
- **BarChart:** Monthly appointment volume breakdown (Completed, Pending, Cancelled).

### Week 12: Performance Optimization & Vercel Deployment
- Configured Vite bundle chunking separating vendor libraries and splitting views into modular chunks.
- SPA edge routing rules (`vercel.json`) ensuring deep links reload without 404 errors.
- Dynamic environment variable configuration (`VITE_API_URL`) supporting local and cloud backends.

---

## 5. Deployment Instructions (Vercel)

### Option 1: Vercel Web Dashboard (Recommended)
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and select your repository.
3. Configure the project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-deployed-backend-url.com/api` (or keep local URL for testing).
5. Click **Deploy**. Vercel will build the project and generate an SSL-enabled production URL.

### Option 2: Deploy via Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel
```

---

## 6. Final System Demonstration Slide Deck Outline

### Slide 1: Title & Introduction
- **Title:** Luxe Salon Management System
- **Subtitle:** Advanced Frontend Web Technology (2501CS401)
- **Team / Presenter:** Darshan University, Semester 5
- **Overview:** An end-to-end luxury salon reservation and management portal.

### Slide 2: Problem Statement & Goals
- Challenges in manual salon appointments, missed double-bookings, untracked inventory, and scattered earnings.
- Goal: Create a unified brown-and-white portal serving Admin, Barber, Receptionist, and Customer personas.

### Slide 3: System Architecture & Technologies
- Component architecture: React 19, Material UI, Vite, Recharts, Axios.
- State management: Lightweight Context API for authentication; component-level state for performance.
- Security: Role-based route guards and Bearer JWT request interceptors.

### Slide 4: Customer Booking Flow (Week 4 & 5)
- Category-grouped service catalog with interactive filters.
- 4-Step Booking Wizard with interactive time slot grid showing booked slots greyed out.

### Slide 5: Operations & Personnel Management (Week 6, 7 & 8)
- Customer personalized metrics and direct profile API configuration.
- Stylist skill filtering directory and shift rosters.
- Master appointment grid with live inline status updates.

### Slide 6: Inventory & Retail Store (Week 9 & 10)
- Stock ledger with automated low-stock warnings and progress gauges.
- Product store with slide-out cart drawer and automatic 18% tax calculation.

### Slide 7: Business Intelligence Analytics (Week 11)
- Area charts displaying sales trajectories.
- Multi-axis employee performance graphs (Appointments vs. Revenue vs. Rating).

### Slide 8: Performance, Optimization & Deployment (Week 12)
- Code splitting results: 70%+ initial bundle reduction; sub-1s initial page load.
- Production deployment on Vercel with SPA routing rules.
- Demonstration Q&A.
