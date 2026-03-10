const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

router.get('/',    auth, async (req, res) => { res.json(await Employee.find()); });
router.post('/',   auth, async (req, res) => { res.json(await new Employee(req.body).save()); });
router.put('/:id', auth, async (req, res) => { res.json(await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true })); });
router.delete('/:id', auth, async (req, res) => { await Employee.findByIdAndDelete(req.params.id); res.json({ msg: 'Deleted' }); });

module.exports = router;