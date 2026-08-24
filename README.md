# 🎓 AlumniConnect — Institutional Networking & Mentorship Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.0-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v5.0-000000.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%20v9-47A248.svg)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#license)

**AlumniConnect** is a full-stack, enterprise-ready networking platform built to bridge the gap between alumni, current students, faculty staff, and institutional administrators. It powers real-time messaging, mentorship matching, job/internship boards, event management, automated student graduation workflows, and robust administrative analytics.

---

## 🌟 Key Features

### 👤 Multi-Role Ecosystem
- **Alumni Portal**: Share career updates, mentor students, post job openings, network with former peers, and attend institution events.
- **Student Portal**: Explore mentorship opportunities, apply for jobs/internships, connect with alumni, and track graduation status.
- **Staff Portal**: Monitor student progress, manage department events, and engage with alumni networks.
- **Admin Dashboard**: Comprehensive system management, user verification, bulk Excel/CSV data imports, content moderation, analytics, landing page customization, and system maintenance controls.

### 💬 Real-Time Communication & Notifications
- **Instant Messaging**: Low-latency 1-on-1 and group communication powered by **Socket.io**.
- **Presence & Active Tracking**: Real-time online/offline status, active chat detection, and typing indicators.
- **Notification Engine**: Instant push alerts for connection requests, mentorship updates, and job responses.

### 🎯 Mentorship & Career Engine
- **Mentorship Hub**: Filter mentors by domain, experience, and availability; request, schedule, and track 1-on-1 mentorship sessions.
- **Job & Internship Board**: Filterable listings with direct application tracking and recruiter/alumni job postings.

### 🔄 Automated Systems & Background Jobs
- **Daily Auto-Graduation**: Scheduled cron job (`node-cron`) running every midnight to automatically promote eligible final-year students to alumni status.
- **Image Optimization & Media Storage**: Automatic client-side and server-side image compression (via Sharp) integrated directly with **AWS S3**.

---

## 🛠️ Technology Stack

| Domain | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | React 19, React Router v7 |
| **UI & Styling** | Vanilla CSS, Framer Motion, React Icons, React Hot Toast |
| **Rich Text & Charts** | React Quill, Chart.js, Recharts, React Multi Carousel |
| **Backend Runtime** | Node.js, Express 5 |
| **Database & ORM** | MongoDB, Mongoose 9 |
| **Real-Time Engine** | Socket.io (WebSocket + Polling fallback) |
| **Storage & Media** | AWS S3, Multer S3, Sharp |
| **Background Tasks** | Node-Cron, Apicache |
| **Security & Auth** | JWT (JSON Web Tokens), bcryptjs, Helmet, Express Rate Limiter, XSS Sanitization |
| **Email Gateway** | Nodemailer (Gmail OAuth2), Resend API |

---

## 📁 Repository Structure

```
AlumniConnectionFrontend/
├── backend/                  # Node.js / Express API Server
│   ├── config/               # Database & service configurations
│   ├── jobs/                 # Automated background jobs (e.g. Graduation Cron)
│   ├── middleware/           # Auth, validation, rate limiters, error handlers
│   ├── models/               # Mongoose schema definitions (User, Job, Chat, Post, etc.)
│   ├── routes/               # Express API endpoints
│   ├── scripts/              # Data utilities & image url link repair scripts
│   ├── services/             # S3 upload, email sending & notification services
│   ├── uploads/              # Local storage fallback for static files
│   ├── seed.js               # Database population script
│   ├── server.js             # Express & Socket.io server entry point
│   └── package.json
│
├── frontend/                 # React Single Page Application
│   ├── public/               # Static public assets
│   ├── src/
│   │   ├── components/       # Reusable UI components (admin, layout, messaging, etc.)
│   │   ├── context/          # React Context providers (Auth, Socket, Theme, etc.)
│   │   ├── pages/            # Page views (Dashboard, Mentorship, Admin, Profile, etc.)
│   │   ├── services/         # API integration services & Axios instances
│   │   ├── styles/           # CSS stylesheets
│   │   ├── App.js            # Main React routing component
│   │   └── index.js          # React DOM root entry point
│   └── package.json
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **MongoDB**: A running local instance or a **MongoDB Atlas** connection string
- **AWS S3 Bucket** (optional for cloud media storage, local fallback available)

---

### 1. Clone the Repository

```bash
git clone https://github.com/bharath9360/AlumniConnectionFrontend.git
cd AlumniConnectionFrontend
```

---

### 2. Backend Setup

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend` directory based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/alumniconnect?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:3000
   ADMIN_SECRET_KEY=your_admin_secret_key

   # AWS S3 Storage
   AWS_ACCESS_KEY=your_aws_access_key
   AWS_SECRET_KEY=your_aws_secret_key
   AWS_REGION=ap-south-1
   AWS_BUCKET=alumni-connect-media-2026

   # Email Gateway Configuration
   EMAIL_PROVIDER=nodemailer
   EMAIL_USER=your-email@gmail.com
   GMAIL_CLIENT_ID=your_oauth2_client_id
   GMAIL_CLIENT_SECRET=your_oauth2_client_secret
   GMAIL_REFRESH_TOKEN=your_oauth2_refresh_token

   # Seed Settings
   SEED_PASSWORD=SeedUserPassword123!
   ```

4. **Seed Initial Data (Optional)**:
   ```bash
   npm run seed
   ```

5. **Start the Backend Server**:
   - **Development mode** (with hot reload via Nodemon):
     ```bash
     npm run dev
     ```
   - **Production mode**:
     ```bash
     npm start
     ```
   The backend API will run at `http://localhost:5000`.

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

4. **Start the Frontend Application**:
   ```bash
   npm start
   ```
   The application will automatically open at `http://localhost:3000`.

---

## 📡 API Architecture Overview

The backend exposes modular REST APIs secured with JWT authentication and rate limiting:

| Endpoint | Description |
| :--- | :--- |
| `POST /api/auth/register` | Register new user (Student / Alumni / Staff) |
| `POST /api/auth/login` | Authenticate user & retrieve JWT token |
| `GET /api/users/profile` | Retrieve authenticated user profile |
| `GET /api/posts` | Fetch community posts feed |
| `POST /api/chat/messages` | Dispatch new real-time message |
| `GET /api/jobs` | Retrieve job & internship listings |
| `GET /api/events` | List upcoming alumni & institutional events |
| `POST /api/mentorship/request` | Submit a mentorship request |
| `GET /api/admin/analytics` | Fetch admin platform usage analytics |
| `POST /api/admin/import-users` | Batch import users via Excel/CSV |
| `GET /api/health` | Health check endpoint |

---

## 🧪 Testing & Verification

Run tests in the frontend application:

```bash
cd frontend
npm test
```

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).

---

## 👨‍💻 Maintainers & Author

- **Bharath** — [*@bharath9360*](https://github.com/bharath9360)
