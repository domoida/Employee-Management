const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const swaggerUi  = require('swagger-ui-express');
require('dotenv').config();

require('./models');

const logger      = require('./middleware/logger');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const swaggerSpec = require('./swagger');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(logger);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authLimiter);
app.use('/api',      apiLimiter);

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/dynamic', require('./routes/dynamic'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);