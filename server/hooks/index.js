const fs   = require('fs');
const path = require('path');
const { defaultHooks } = require('./default.hooks');

// How to add hooks for a new model:
// 1. Create server/hooks/{modelname}.hooks.js  (e.g. product.hooks.js)
// 2. Export const {modelname}Hooks = { beforeCreate, afterCreate, ... }
// 3. The system will automatically detect and load it — no other changes needed

const loadHooks = (modelName) => {
  const name     = modelName.toLowerCase();
  const hookFile = path.join(__dirname, `${name}.hooks.js`);

  if (fs.existsSync(hookFile)) {
    console.log(`[HOOKS] Loading custom hooks for model: ${modelName}`);
    const module = require(hookFile);
    // Look for export named e.g. employeeHooks, productHooks, etc.
    const exportKey = Object.keys(module).find(k => k.toLowerCase() === `${name}hooks`);
    if (exportKey) return module[exportKey];
  }

  console.log(`[HOOKS] No custom hooks found for ${modelName} — using defaults`);
  return defaultHooks;
};

module.exports = { loadHooks };