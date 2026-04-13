const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

// Load all models on startup
require('./models');

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/dynamic', require('./routes/dynamic'));


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
