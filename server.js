const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

const origin = 'http://localhost:5173'
// const origin = 'https://nutritionalnuts.netlify.app'

// CORS configuration
app.use(cors({
    origin: origin, // Replace with your domain(s)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Rate limiter middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        status: 429,
        error: 'Too many requests. Please try again later.'
    }
});
app.use(limiter);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Api's Now Live By Ashish Tiwari");
});

// app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/email', require('./routes/emailRoutes.js'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
