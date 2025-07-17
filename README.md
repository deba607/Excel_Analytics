# 🚀 Excel Analytics Platform

A modern web application for advanced Excel/CSV data analysis, visualization, and reporting. Empower your business with AI-powered insights, beautiful dashboards, and secure file management—all in one place.

---

## ✨ Features

- **Data Import:** Upload Excel, CSV, and JSON files with ease
- **Advanced Analytics:** Generate insights, summary statistics, and trends
- **Interactive Visualization:** Create charts and dashboards (bar, line, pie, doughnut, radar, polar area)
- **AI-Powered Automation:** Smart workflow optimization and predictive analytics
- **User Authentication:** Secure OTP-based login, Google OAuth, password reset
- **File Management:** Organize, search, and manage uploaded files
- **Report Generation:** Export analysis results as PDF, CSV, and more
- **Admin Dashboard:** Manage users, files, and reports with advanced controls

---

## 🛠️ Tech Stack

**Frontend:**
- React 19, Vite, Tailwind CSS
- React Router DOM, Axios
- Chart.js, React Hot Toast, Framer Motion

**Backend:**
- Node.js, Express.js
- MongoDB (with GridFS for file storage)
- Mongoose, JWT Authentication
- Multer (file uploads), Nodemailer (email/OTP)
- Zod (validation), Passport (Google OAuth)

---

## 📁 Project Structure

```
Excel_Analytics/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page views
│   │   ├── store/        # State management
│   │   └── assets/       # Static assets
│   └── package.json
├── server/           # Node.js backend
│   ├── controllers/  # Route controllers
│   ├── models/       # Database models
│   ├── middlewares/  # Express middlewares
│   ├── router/       # API routes
│   ├── utils/        # Utility functions
│   └── package.json
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Excel_Analytics
   ```
2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```
3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```
4. **Environment Setup**
   Create a `.env` file in the `server/` directory:
   ```env
   MONGO_DB_URI=mongodb://localhost:27017/excel_analytics
   SECRET_KEY=your_jwt_secret_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   PORT=8000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```
5. **Start the servers**
   - Backend: `cd server && npm start`
   - Frontend: `cd client && npm run dev`

6. **Access the app**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:8000](http://localhost:8000)

---

## 🧭 Usage Guide

- **Sign Up / Login:** Register with email, verify OTP, or use Google OAuth
- **Dashboard:** Import files, analyze data, generate charts, and download reports
- **Admin:** Access advanced management features for users, files, and reports

---

## 🔗 API Endpoints (Summary)

### Authentication
- `POST /api/auth/send-otp` — Send registration OTP
- `POST /api/auth/verify-otp` — Verify registration OTP
- `POST /api/auth/register` — User registration
- `POST /api/authLogin/send-login-otp` — Send login OTP
- `POST /api/authLogin/verify-login-otp` — Verify login OTP

### Files
- `POST /api/v1/files` — Upload files
- `GET /api/v1/files/getfiles` — List user files
- `DELETE /api/v1/files/:fileId` — Delete file

### Analysis
- `GET /api/v1/analysis` — Get analysis summary
- `GET /api/v1/analysis/generate` — Generate specific analysis/chart

---

## 🗃️ Data Models (Backend)

- **User_Registration**: `{ name, email, password (hashed), isAdmin, googleId, isEmailVerified, signupComplete }`
- **Admin**: `{ name, email, password (hashed) }`
- **File**: `{ gridFsId, originalName, size, userEmail, status, columns, timestamps }`
- **Analysis**: `{ userEmail, fileId, fileName, chartType, xAxis, yAxis, reportGridFsId, createdAt, updatedAt }`
- **Otp**: `{ email, otp, type, expiresAt }`

---

## 🛡️ Security & Best Practices
- JWT-based authentication for all protected routes
- OTP verification for registration and login
- Input validation with Zod
- CORS and secure file upload handling
- Passwords hashed with bcrypt

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License

---

> **Excel Analytics Platform** — Empowering data-driven decisions with modern analytics.
