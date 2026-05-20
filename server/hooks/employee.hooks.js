// Custom hooks for the Employee model.
// Add business logic here that should run before or after each CRUD operation.

const employeeHooks = {
  // Normalize name casing and trim whitespace before saving
  beforeCreate: async (data) => {
    console.log('[HOOKS] Employee beforeCreate — normalizing fields');
    return {
      ...data,
      firstName:  data.firstName  ? data.firstName.trim()  : data.firstName,
      lastName:   data.lastName   ? data.lastName.trim()   : data.lastName,
      email:      data.email      ? data.email.toLowerCase().trim() : data.email,
      position:   data.position   ? data.position.trim()   : data.position,
      department: data.department ? data.department.trim() : data.department,
    };
  },

  afterCreate: async (result) => {
    console.log(`[HOOKS] Employee afterCreate — new employee created: ${result.firstName} ${result.lastName}`);
    return result;
  },

  // Normalize fields on update as well
  beforeUpdate: async (data) => {
    console.log('[HOOKS] Employee beforeUpdate — normalizing fields');
    const cleaned = { ...data };
    if (cleaned.firstName)  cleaned.firstName  = cleaned.firstName.trim();
    if (cleaned.lastName)   cleaned.lastName   = cleaned.lastName.trim();
    if (cleaned.email)      cleaned.email      = cleaned.email.toLowerCase().trim();
    if (cleaned.position)   cleaned.position   = cleaned.position.trim();
    if (cleaned.department) cleaned.department = cleaned.department.trim();
    return cleaned;
  },

  afterUpdate: async (result) => {
    console.log(`[HOOKS] Employee afterUpdate — record updated: ${result._id}`);
    return result;
  },

  beforeDelete: async (data) => {
    console.log(`[HOOKS] Employee beforeDelete — soft deleting: ${data.id}`);
    return data;
  },

  afterDelete: async (result) => {
    console.log(`[HOOKS] Employee afterDelete — deleted: ${result.firstName} ${result.lastName}`);
    return result;
  },

  beforeRead: async (query) => {
    console.log('[HOOKS] Employee beforeRead — query intercepted');
    return query;
  },

  afterRead: async (result) => {
    const count = Array.isArray(result) ? result.length : 1;
    console.log(`[HOOKS] Employee afterRead — returned ${count} record(s)`);
    return result;
  },
};

module.exports = { employeeHooks };