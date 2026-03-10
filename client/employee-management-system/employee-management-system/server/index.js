const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json()); // Essential for parsing login/registration data [cite: 4, 6]
app.use(cors());

app.use('/api/auth', require('./routes/auth'));

// Basic Route for testing
app.get('/', (req, res) => res.send('API is running...'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.error('Connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));