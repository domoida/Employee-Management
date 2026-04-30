const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: false, message: 'Validation failed', error: 'Email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Registration failed', error: 'Email already in use' });
    }
    const user = new User({ email, password, role: role || 'user' });
    await user.save();
    res.status(201).json({ status: true, message: 'User registered successfully', data: null });
  } catch (err) {
    res.status(400).json({ status: false, message: 'Registration failed', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: false, message: 'Validation failed', error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: false, message: 'Invalid credentials', error: 'Email or password is incorrect' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ status: true, message: 'Login successful', data: { token, role: user.role } });
  } catch (err) {
    res.status(500).json({ status: false, message: 'Login failed', error: err.message });
  }
});

module.exports = router;