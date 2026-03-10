const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

// Middleware to protect routes (Authentication Check)
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
};

// @route   GET /api/employees
// @desc    Get all employees (Protected)
router.get('/', auth, async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/employees
// @desc    Add new employee (Protected)
router.post('/', auth, async (req, res) => {
    const { firstName, lastName, email, position, department } = req.body;
    try {
        const newEmployee = new Employee({ firstName, lastName, email, position, department });
        const employee = await newEmployee.save();
        res.json(employee);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/employees/:id
// @desc    Update employee (Protected)
router.put('/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(employee);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee (Protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Employee removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;