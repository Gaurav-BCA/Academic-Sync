# Academic-Sync 🎓
> **Next-Generation Real-Time Attendance Management & Geofenced Integrity Platform**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.19.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.12-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com/Gaurav-BCA/Academic-Sync)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Project Overview

**Academic-Sync** is an enterprise-grade, cloud-native academic management platform built to modernize attendance tracking, schedule governance, and student welfare for higher education institutions such as **MIET Kumaon**.

Traditional attendance logging often suffers from proxy check-ins, manual ledger errors, and delayed dispute reconciliation. Academic-Sync resolves these vulnerabilities by combining **high-precision GPS Haversine geofencing**, **real-time Firebase Firestore synchronization**, and **role-isolated administrative portals**.

```text
                           ┌──────────────────────────────┐
                           │   Academic-Sync Cloud Core   │
                           │     (Firebase Firestore)     │
                           └──────────────┬───────────────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
┌───────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│     Student Gate      │   │       Teacher Panel       │   │      Coordinator Hub      │
│  • GPS Verification   │   │  • Session Execution      │   │  • Batch Setup & Codes    │
│  • Reconcile Requests │   │  • Dispute Resolution     │   │  • Timetable Management   │
│  • AI Draft Generator │   │  • Real-Time Geo Override │   │  • Faculty Approvals      │
└───────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
```

---

## ✨ Key Features

### 🛰️ Real-Time GPS Geofencing Engine
- **Haversine Distance Formula**: Computes precise spherical surface distance in meters between student device coordinates and campus center coordinates ($R = 6,371,000\text{ m}$).
- **50m Campus Radius Guard**: Students outside the 50-meter perimeter are automatically marked `ABSENT` upon session execution.
- **Dynamic Override**: Teachers and Coordinators can configure custom GPS center coordinates and radius parameters per batch.

### 🔐 Multi-Portal Role Isolation & Security
- **Strict Role Guards**: Separate authentication gateways for **Students** (`/`), **Faculty** (`/faculty-login`), and **Class Coordinators**.
- **Coordinator Approval Security**: Newly registered faculty accounts require explicit activation by a Class Coordinator before gaining portal access.
- **Batch Code Verification**: Student registration requires an active 6-digit Firestore batch code (e.g. `CS-4051`), preventing unauthorized or orphan account creation.

### 📊 Attendance Integrity & Live Leaderboard
- **Dynamic Percentage Calculations**: Real-time attendance computation strictly based on total conducted lectures (`(Attended / Conducted) * 100`).
- **Zero-State Resilience**: Clean `0.0%` initialization for new cohorts without NaN or divide-by-zero errors.
- **Standing Tier Badges**: Ranks students dynamically into **Gold**, **Silver**, and **Bronze** tiers based on live attendance performance.

### 🔄 Real-Time Timetable Engine & Live Sync
- **Interactive Timetable Editor**: Class Coordinators can dynamically add, edit, or delete class slots across all days of the week (Mon–Sat).
- **Instant Synchronization**: Schedule changes saved to Firestore `batches/{classCode}` immediately propagate to all enrolled students and teachers via active `onSnapshot` listeners without page reloads.

### 🛠️ Reconcile & Dispute Resolution System
- **Teacher-Routed Requests**: Students can submit custom correction requests (e.g. Medical Pass, GPS Check-in Issue) directly to the Teacher Dashboard for 1-click approval/rejection.
- **Instant Self-Mark Absent**: Students marked `PRESENT` can voluntarily mark themselves `ABSENT` with immediate database updates.

### 🤖 AI Academic Application Generator
- **Dynamic Metadata Injection**: Powered by Google Gemini AI, generating formal leave, duty pass, and medical applications pre-populated with student name, roll number, semester, cohort, and institution details.

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** (Vite 5) | Component-driven UI rendering with Fast Refresh |
| **Language** | **TypeScript 5.6** | Strict type checking and compile-time safety |
| **Styling & UI** | **Tailwind CSS 3.4** | Modern utility-first responsive styling |
| **Icons** | **Lucide React** | High-performance SVG iconography |
| **Database & Auth** | **Firebase Firestore & Auth** | Cloud database with real-time `onSnapshot` listeners |
| **Data Visualization** | **Recharts** | Interactive charts for attendance trends & streak analytics |
| **Location Verification** | **HTML5 Geolocation API** | Native device GPS coordinates retrieval |
| **Math Engine** | **Haversine Formula** | Great-circle distance calculations ($R = 6,371,000\text{ m}$) |
| **AI Processing** | **Google Gemini AI API** | AI application drafting and OCR parsing |

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### 1. Clone the Repository
```bash
git clone https://github.com/Gaurav-BCA/Academic-Sync.git
cd Academic-Sync
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root with your Firebase and Gemini credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Launch Local Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Execute Build Verification
To run TypeScript compiler verification and generate production assets:
```bash
npm run build
```

---

## 🧪 Automated Geofencing Test Suite

Academic-Sync includes a standalone headless unit test script to verify the Haversine distance engine:

```bash
node scripts/test-geofence.js
```

### Sample Output:
```text
====================================================
 GEOFENCING ATTENDANCE ENGINE HEADLESS TEST SUITE   
====================================================

[TEST PASS] Inside Geofence (30.0m) -> PRESENT
[TEST PASS] Outside Geofence (75.1m) -> ABSENT

====================================================
SUCCESS: All Geofencing Test Cases Passed with 0 errors!
====================================================
```

---

## 📂 Repository Architecture

```text
Academic-Sync/
├── public/                  # Static web assets
├── scripts/
│   └── test-geofence.js     # Headless geofencing unit test runner
├── src/
│   ├── components/          # Reusable UI components (HeaderNav, EditTimetableModal, etc.)
│   ├── context/             # AppContext & OnboardingContext global state
│   ├── data/                # Initial batch data & student roster definitions
│   ├── hooks/               # Custom hooks (useActiveLectureSlot)
│   ├── screens/             # Core views (Dashboard, Reconcile, Leaderboard, AI Tools, Manage)
│   ├── services/            # Firebase SDK setup & Gemini AI integration
│   ├── utils/               # Math utilities (haversine formula, attendance percentages)
│   ├── App.tsx              # Main application router & role gatekeepers
│   └── main.tsx             # Application entry point
├── .gitignore               # Excluded build & credential artifacts
├── package.json             # NPM dependencies & build scripts
├── tsconfig.json            # TypeScript compiler configuration
└── vite.config.ts           # Vite build runner configuration
```

---

## 👤 Author & Credits

Designed and developed by:
- **Gaurav Bisht**  
  *Bachelor of Computer Applications (BCA)*  
  **MIET Kumaon**

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
