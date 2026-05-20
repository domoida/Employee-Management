// Default hooks — used for any model without a custom hook file.
// All hooks simply pass data through unchanged.
// To add custom logic for a model, create server/hooks/{modelname}.hooks.js

const defaultHooks = {
  beforeCreate: async (data)   => { return data;   },
  afterCreate:  async (result) => { return result; },
  beforeUpdate: async (data)   => { return data;   },
  afterUpdate:  async (result) => { return result; },
  beforeDelete: async (data)   => { return data;   },
  afterDelete:  async (result) => { return result; },
  beforeRead:   async (query)  => { return query;  },
  afterRead:    async (result) => { return result; },
};

module.exports = { defaultHooks };