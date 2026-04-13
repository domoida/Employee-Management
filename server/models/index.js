const mongoose = require('mongoose');

// ─────────────────────────────────────────────
// CENTRAL MODEL REGISTRY
// Add new models here — CRUD routes auto-generate
// ─────────────────────────────────────────────

const modelDefinitions = {
  Employee: {
    fields: {
      firstName:  { type: 'string',  required: true  },
      lastName:   { type: 'string',  required: true  },
      email:      { type: 'email',   required: true,  unique: true },
      position:   { type: 'string',  required: true  },
      department: { type: 'string',  required: true  },
    }
  },
  // Add more models below this line:
  // Department: {
  //   fields: {
  //     name:        { type: 'string', required: true, unique: true },
  //     description: { type: 'string', required: false },
  //   }
  // },
};

// ─────────────────────────────────────────────
// TYPE MAPPING: definition type → Mongoose type
// ─────────────────────────────────────────────
const typeMap = {
  string:  String,
  email:   String,
  number:  Number,
  date:    Date,
  boolean: Boolean,
};

// ─────────────────────────────────────────────
// AUTO-BUILD MONGOOSE MODELS
// ─────────────────────────────────────────────
const models = {};

for (const [modelName, definition] of Object.entries(modelDefinitions)) {
  const schemaFields = {};

  for (const [fieldName, opts] of Object.entries(definition.fields)) {
    schemaFields[fieldName] = {
      type:     typeMap[opts.type] || String,
      required: opts.required || false,
      unique:   opts.unique   || false,
      trim:     true,
    };
  }

  // Every model gets soft delete + audit fields automatically
  schemaFields.deletedAt  = { type: Date,   default: null };
  schemaFields.createdBy  = { type: String, default: 'system' };
  schemaFields.updatedBy  = { type: String, default: 'system' };

  const schema = new mongoose.Schema(schemaFields, { timestamps: true });

  // Soft-delete: filter out deleted records by default
  schema.pre(/^find/, function(next) {
  const op = this.op;
  // Don't filter on update operations — restore needs to find deleted records
  if (op === 'findOneAndUpdate' || op === 'findOneAndDelete') return next();
  if (this._conditions.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

  models[modelName] = mongoose.models[modelName] || mongoose.model(modelName, schema);
}

module.exports = { models, modelDefinitions };
