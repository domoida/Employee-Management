const express    = require('express');
const router     = express.Router();
const { models, modelDefinitions } = require('../models');
const AuditLog   = require('../models/AuditLog');
const validate   = require('../middleware/validate');
const { auth, requireRole } = require('../middleware/auth');

const getUserId = (req) => req.user?.id || 'system';

router.get('/schema', auth, (req, res) => {
  res.json({ status: true, message: 'Schema retrieved', data: modelDefinitions });
});

for (const modelName of Object.keys(models)) {
  const Model = models[modelName];
  const base  = `/${modelName.toLowerCase()}s`;

  // GET all — paginated, soft-delete filtered
  router.get(base, auth, async (req, res) => {
    try {
      const page  = Math.max(1, parseInt(req.query.page)  || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 50);
      const skip  = (page - 1) * limit;
      const [records, total] = await Promise.all([
        Model.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        Model.countDocuments()
      ]);
      res.json({ status: true, message: 'Records retrieved', data: records, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      res.status(500).json({ status: false, message: 'Failed to fetch records', error: err.message });
    }
  });

  // GET single
  router.get(`${base}/:id`, auth, async (req, res) => {
    try {
      const record = await Model.findById(req.params.id);
      if (!record) return res.status(404).json({ status: false, message: 'Not found', error: 'Record does not exist' });
      res.json({ status: true, message: 'Record retrieved', data: record });
    } catch (err) {
      res.status(500).json({ status: false, message: 'Failed to fetch record', error: err.message });
    }
  });

  // GET audit log
  router.get(`${base}/:id/audit`, auth, async (req, res) => {
    try {
      const logs = await AuditLog.find({ model: modelName, recordId: req.params.id }).sort({ timestamp: -1 });
      res.json({ status: true, message: 'Audit log retrieved', data: logs });
    } catch (err) {
      res.status(500).json({ status: false, message: 'Failed to fetch audit log', error: err.message });
    }
  });

  // POST create — admin only
  router.post(base, auth, requireRole('admin'), validate(modelName), async (req, res) => {
    try {
      const userId = getUserId(req);
      const record = await new Model({ ...req.body, createdBy: userId, updatedBy: userId }).save();
      await AuditLog.create({ model: modelName, recordId: record._id, action: 'CREATE', performedBy: userId, changes: req.body });
      res.status(201).json({ status: true, message: `${modelName} created successfully`, data: record });
    } catch (err) {
      res.status(400).json({ status: false, message: 'Failed to create record', error: err.message });
    }
  });

  // PUT update — admin only
  router.put(`${base}/:id`, auth, requireRole('admin'), validate(modelName), async (req, res) => {
    try {
      const userId = getUserId(req);
      const before = await Model.findById(req.params.id);
      if (!before) return res.status(404).json({ status: false, message: 'Not found', error: 'Record does not exist' });
      const record = await Model.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: userId }, { new: true });
      await AuditLog.create({ model: modelName, recordId: req.params.id, action: 'UPDATE', performedBy: userId, changes: req.body });
      res.json({ status: true, message: `${modelName} updated successfully`, data: record });
    } catch (err) {
      res.status(400).json({ status: false, message: 'Failed to update record', error: err.message });
    }
  });

  // DELETE soft delete — admin only
  router.delete(`${base}/:id`, auth, requireRole('admin'), async (req, res) => {
    try {
      const userId = getUserId(req);
      const record = await Model.findByIdAndUpdate(req.params.id, { deletedAt: new Date(), updatedBy: userId }, { new: true });
      if (!record) return res.status(404).json({ status: false, message: 'Not found', error: 'Record does not exist' });
      await AuditLog.create({ model: modelName, recordId: req.params.id, action: 'DELETE', performedBy: userId });
      res.json({ status: true, message: `${modelName} deleted successfully`, data: record });
    } catch (err) {
      res.status(500).json({ status: false, message: 'Failed to delete record', error: err.message });
    }
  });

  // PATCH restore — admin only
  router.patch(`${base}/:id/restore`, auth, requireRole('admin'), async (req, res) => {
    try {
      const userId = getUserId(req);
      const record = await Model.findByIdAndUpdate(req.params.id, { deletedAt: null, updatedBy: userId }, { new: true });
      if (!record) return res.status(404).json({ status: false, message: 'Not found', error: 'Record does not exist' });
      await AuditLog.create({ model: modelName, recordId: req.params.id, action: 'RESTORE', performedBy: userId });
      res.json({ status: true, message: `${modelName} restored successfully`, data: record });
    } catch (err) {
      res.status(500).json({ status: false, message: 'Failed to restore record', error: err.message });
    }
  });

  // GET trash
  router.get(`${base}-deleted`, auth, requireRole('admin'), async (req, res) => {
    try {
      const records = await Model.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
      res.json({ status: true, message: 'Deleted records retrieved', data: records });
    } catch (err) {
      res.status(500).json({ status: false, message: 'Failed to fetch deleted records', error: err.message });
    }
  });
}

module.exports = router;