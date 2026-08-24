# 🐾 Animal Rescue & Emergency Response Platform

A production-ready full-stack web application designed for municipal and community animal emergency response, veterinary trauma care, sanctuary shelter management, volunteer coordination, and adoptions.

---

## 🚀 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, React Router v6, Axios, Leaflet / React-Leaflet (OpenStreetMap), Lucide Icons, Canvas-Confetti.
- **Backend**: Node.js, Express.js, MongoDB / Mongoose (with embedded zero-config MongoMemoryServer fallback), JWT Authentication, bcryptjs, Multer file upload with Cloudinary and local disk storage fallback.
- **AI Engine**: Hybrid AI Triage Engine (Gemini 1.5 Flash API with intelligent rule-based distress fallback) for real-time symptom analysis and immediate citizen first-aid advice.

---

## 👥 Supported Roles & 1-Click Demo Logins

The application features **Role-Based Access Control (RBAC)** across 6 user types:

| Role | Demo Email | Password | Primary Dashboard & Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@example.com` | `password123` | Report distress, drop GPS pins, track rescue timeline, adopt |
| **Rescue Team** | `rescue@example.com` | `password123` | Real-time Leaflet map dispatch, accept rescue, advance status, transfer to vet |
| **Veterinarian** | `vet@example.com` | `password123` | Clinical trauma chart, vitals, prescriptions builder, surgery logs, discharge |
| **Shelter** | `shelter@example.com` | `password123` | Kennel management, daily feeding/med care logs, adoption listings, review inquiries |
| **Volunteer** | `volunteer@example.com` | `password123` | Claim community rescue/transport/feeding tasks, log volunteer impact hours |
| **Administrator** | `admin@example.com` | `password123` | System analytics & KPIs, species breakdown, verify users, governance |

> **Tip:** You can use the floating **"Switch Demo Role"** button at the bottom-right of any page to switch between roles in 1-click!

---

## 🔄 End-to-End Rescue Workflow

1. **Emergency Report**: A Citizen reports an injured animal with photo, description, and GPS coordinates.
2. **AI Triage**: Instant AI evaluation predicts severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and gives first-aid advice.
3. **Rescue Dispatch**: Nearby Rescue Teams receive real-time notifications on their OpenStreetMap interface and accept the mission.
4. **Milestone Tracking**: Rescue Team advances status (`EN_ROUTE` $\rightarrow$ `ARRIVED` $\rightarrow$ `RESCUED`).
5. **Hospital Transfer**: Animal is transferred to a registered Veterinary Hospital.
6. **Clinical Care**: Veterinarian records vitals, prescribes medications, performs surgery, and logs treatment notes.
7. **Shelter Admission & Rehab**: Discharged animal is admitted to a Shelter kennel, receiving daily care logs.
8. **Forever Home Adoption**: Rehabilitated animal is listed on the public Adoption Portal; Citizens apply and celebrate adoption with confetti!

---

## 🛠️ Project Structure

```
├── /client                     # Vite + React Frontend
│   ├── /src
│   │   ├── /components
│   │   │   ├── /common         # Navbar, Footer, StatusBadge, ProtectedRoute, DemoSwitcher
│   │   │   └── /maps           # LocationPickerMap, LiveRescueMap (Leaflet/OpenStreetMap)
│   │   ├── /context            # AuthContext, NotificationContext
│   │   ├── /pages              # Home, Login, Register, EmergencyReport, Dashboards, Adoption
│   │   ├── /services           # Axios API instance
│   │   ├── App.jsx             # React Router setup with Role guards
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── /server                     # Express.js Backend
│   ├── /src
│   │   ├── /config             # MongoDB connection (with memory fallback) & Cloudinary
│   │   ├── /controllers        # Auth, Emergency, Rescue, Medical, Shelter, Volunteer, Admin, AI
│   │   ├── /middleware         # JWT Auth, Role RBAC, Multer upload, Global Error Handler
│   │   ├── /models             # User, EmergencyReport, MedicalRecord, ShelterRecord, AdoptionInquiry, etc.
│   │   ├── /routes             # REST API routes
│   │   └── /utils              # Seed script, Notification helper, AI triage engine
│   ├── .env.example
│   ├── server.js
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Server
```bash
cd server
npm install
node server.js
```
The server will connect to MongoDB (or embedded MongoMemoryServer automatically) and seed all demo data.
Runs on `http://localhost:5000`.

### 2. Frontend Client
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔒 Environment Variables

### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/animal_rescue_db
JWT_SECRET=super_secret_jwt_key_for_animal_rescue_platform_2026_dev
JWT_EXPIRE=7d

# Optional Cloudinary (Local disk fallback enabled automatically if empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional Gemini API (Smart rule-based AI triage fallback enabled automatically if empty)
GEMINI_API_KEY=
```

### Frontend (`client/.env`):
```env
VITE_API_URL=/api
```
