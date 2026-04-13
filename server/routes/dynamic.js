const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const { models, modelDefinitions } = require('../models');
const AuditLog = require('../models/AuditLog');
const validate = require('../middleware/validate');

// ── Auth middleware ──────────────────────────
const auth = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

const getUserId = (req) => req.user?.id || 'system';

// ── Expose model definitions to frontend ────
router.get('/schema', auth, (req, res) => {
  res.json(modelDefinitions);
});

// ── Generate CRUD routes for every model ────
for (const modelName of Object.keys(models)) {
  const Model = models[modelName];
  const base  = `/${modelName.toLowerCase()}s`;

  // GET all (excluding soft-deleted)
  router.get(base, auth, async (req, res) => {
    try {
      const records = await Model.find().sort({ createdAt: -1 });
      res.json(records);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET single
  router.get(`${base}/:id`, auth, async (req, res) => {
    try {
      const record = await Model.findById(req.params.id);
      if (!record) return res.status(404).json({ msg: 'Not found' });
      res.json(record);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET audit log for a record
  router.get(`${base}/:id/audit`, auth, async (req, res) => {
    try {
      const logs = await AuditLog.find({ model: modelName, recordId: req.params.id }).sort({ timestamp: -1 });
      res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST create
  router.post(base, auth, validate(modelName), async (req, res) => {
    try {
      const userId = getUserId(req);
      const record = await new Model({ ...req.body, createdBy: userId, updatedBy: userId }).save();
      await AuditLog.create({ model: modelName, recordId: record._id, action: 'CREATE', performedBy: userId, changes: req.body });
      res.status(201).json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });

  // PUT update
  router.put(`${base}/:id`, auth, validate(modelName), async (req, res) => {
    try {
      const userId = getUserId(req);
      const before = await Model.findById(req.params.id);
      if (!before) return res.status(404).json({ msg: 'Not found' });
      const record = await Model.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: userId },
        { new: true }
      );
      await AuditLog.create({ model: modelName, recordId: req.params.id, action: 'UPDATE', performedBy: userId, changes: req.body });
      res.json(record);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });

  // DELETE soft delete
  router.delete(`${base}/:id`, auth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const record = await Model.findByIdAndUpdate(
        req.params.id,
        { deletedAt: new Date(), updatedBy: userId },
        { new: true }
      );
      if (!record) return res.status(404).json({ msg: 'Not found' });
      await AuditLog.create({ model: modelName, recordId: req.params.id, action: 'DELETE', performedBy: userId });
      res.json({ msg: 'Record soft deleted', record });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // PATCH restore soft-deleted record
  router.patch(`${base}/:id/restore`, auth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const record = await Model.findByIdAndUpdate(
        req.params.id,
        { deletedAt: null, updatedBy: userId },
        { new: true }
      );
      if (!record) return res.status(404).json({ msg: 'Not found' });
      await AuditLog.create({ model: modelName, recordId: req.params.id, action: 'RESTORE', performedBy: userId });
      res.json(record);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET deleted records (trash)
  router.get(`${base}-deleted`, auth, async (req, res) => {
    try {
      const records = await Model.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
      res.json(records);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}

module.exports = router;
