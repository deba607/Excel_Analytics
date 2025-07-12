# Excel Analytics Platform

A comprehensive web application for Excel data analysis, visualization, and reporting.

## Features

- **Data Import**: Upload Excel, CSV, and JSON files
- **Data Analysis**: Generate insights and statistics
- **Visualization**: Create charts and graphs
- **User Authentication**: Secure login with OTP verification
- **File Management**: Organize and manage uploaded files
- **Export Capabilities**: Download analysis results

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Chart.js
- React Hot Toast

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Nodemailer for email services

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── assets/        # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── middlewares/      # Custom middlewares
│   ├── router/           # API routes
│   ├── utils/            # Utility functions
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Excel_Analytics
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the server directory:
   ```env
   MONGO_DB_URI=mongodb://localhost:27017/excel_analytics
   SECRET_KEY=your_jwt_secret_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   PORT=8000
   NODE_ENV=development
   ```

5. **Start the development servers**

   **Start the backend server:**
   ```bash
   cd server
   npm start
   ```

   **Start the frontend development server:**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send registration OTP
- `POST /api/auth/verify-otp` - Verify registration OTP
- `POST /api/auth/register` - User registration
- `POST /api/authLogin/send-login-otp` - Send login OTP
- `POST /api/authLogin/verify-login-otp` - Verify login OTP

### Files
- `POST /api/files` - Upload files
- `GET /api/files/getfiles` - Get user files
- `DELETE /api/files/:fileId` - Delete file

### Analysis
- `GET /api/v1/analysis` - Generate analysis
- `GET /api/v1/analysis/generate` - Generate specific analysis

## Development

### Code Quality
- ESLint configuration for both client and server
- Consistent code formatting
- Error handling best practices

### Security
- JWT-based authentication
- Input validation with Zod
- CORS configuration
- Secure file upload handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
