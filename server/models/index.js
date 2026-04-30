const mongoose = require('mongoose');

const modelDefinitions = {
  Employee: {
    fields: {
      firstName:  { type: 'string', required: true },
      lastName:   { type: 'string', required: true },
      email:      { type: 'email',  required: true, unique: true },
      position:   { type: 'string', required: true },
      department: { type: 'string', required: true },
    }
  },
};

const typeMap = { string: String, email: String, number: Number, date: Date, boolean: Boolean };
const models  = {};

for (const [modelName, definition] of Object.entries(modelDefinitions)) {
  const schemaFields = {};
  for (const [fieldName, opts] of Object.entries(definition.fields)) {
    schemaFields[fieldName] = {
      type:     typeMap[opts.type] || String,
      required: opts.required || false,
      unique:   opts.unique   || false,
      trim:     true,
      ...(opts.type === 'email' && { index: true })
    };
  }
  schemaFields.deletedAt = { type: Date,   default: null, index: true };
  schemaFields.createdBy = { type: String, default: 'system' };
  schemaFields.updatedBy = { type: String, default: 'system' };

  const schema = new mongoose.Schema(schemaFields, { timestamps: true });
  schema.index({ deletedAt: 1, createdAt: -1 });

  schema.pre(/^find/, function (next) {
    const op = this.op;
    if (op === 'findOneAndUpdate' || op === 'findOneAndDelete') return next();
    if (this._conditions.deletedAt === undefined) this.where({ deletedAt: null });
    next();
  });

  models[modelName] = mongoose.models[modelName] || mongoose.model(modelName, schema);
}

module.exports = { models, modelDefinitions };