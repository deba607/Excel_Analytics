const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDb = require('./utils/db');
const { errorHandler } = require('./utils/errorResponse');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const userauthRouter = require('./router/userauthRouter');
const userauthLoginRouter = require('./router/userauthLogin');
const userContactRouter = require('./router/userContact');
const fileRoutes = require('./router/fileRoutes');
const analysisRoutes = require('./router/analysis');
const googleAuthRouter = require('./router/googleAuthRouter');
const adminLoginRouter = require('./router/adminLogin');

const app = express();

// lets tackle CORS issue
const corsOptions = {
  origin: 'http://localhost:5173',
  //origin: 'https://merndebanjan.netlify.app', // Replace with your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));

// Session middleware for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(bodyParser.json());

app.get('/excel_analytics', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasSecretKey: !!process.env.SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

app.get('/api/auth-test', (req, res) => {
  const token = req.headers.authorization;
  res.json({ 
    message: 'Auth test endpoint',
    hasToken: !!token,
    tokenType: token ? token.split(' ')[0] : 'none',
    timestamp: new Date().toISOString()
  });
});


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use('/api/auth', userauthRouter);
app.use('/api/authLogin', userauthLoginRouter);
app.use('/api/contact', userContactRouter);
app.use('/api/adminLogin', adminLoginRouter);

// Google OAuth routes
app.use('/api/auth', googleAuthRouter);

// Set static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/output', express.static(path.join(__dirname, 'output')));

// Mount routers
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/analysis', analysisRoutes);

// Error middleware should be last
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
connectDb().then(() => {
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  });
});