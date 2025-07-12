const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDb = require('./utils/db');
const { errorMiddleware } = require('./middlewares/error-middleware');
const bodyParser = require('body-parser');
const userauthRouter = require('./router/userauthRouter');
const userauthLoginRouter = require('./router/userauthLogin');
const userContactRouter = require('./router/userContact');
const fileRoutes = require('./router/fileRoutes');
const analysisRoutes = require('./router/analysis');

const app = express();

// lets tackle CORS issue
const corsOptions = {
  origin: 'http://localhost:5173',
  //origin: 'https://merndebanjan.netlify.app', // Replace with your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));


app.use(express.json());


app.use(bodyParser.json());




app.use(errorMiddleware);

app.get('/excel_analytics', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Server is working!' });
});


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use('/api/auth', userauthRouter);
app.use('/api/authLogin', userauthLoginRouter);
app.use('/api/contact', userContactRouter);

// Set static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Mount routers
app.use('/api/files', fileRoutes);
app.use('/api/v1/analysis', analysisRoutes);


const PORT = process.env.PORT || 8000;
connectDb().then(()=>{
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  });
});