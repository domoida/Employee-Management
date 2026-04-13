const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  model:     { type: String, required: true },
  recordId:  { type: String, required: true },
  action:    { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'], required: true },
  performedBy: { type: String, default: 'system' },
  changes:   { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
