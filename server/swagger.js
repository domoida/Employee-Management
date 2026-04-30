const { modelDefinitions } = require('./models');

const buildSchema = (definition) => {
  const properties = {};
  const required   = [];
  for (const [field, opts] of Object.entries(definition.fields)) {
    properties[field] = { type: opts.type === 'email' ? 'string' : opts.type, ...(opts.type === 'email' && { format: 'email' }) };
    if (opts.required) required.push(field);
  }
  return { type: 'object', properties, required };
};

const successEnvelope = (description) => ({
  description,
  content: { 'application/json': { schema: { type: 'object', properties: {
    status:  { type: 'boolean', example: true },
    message: { type: 'string' },
    data:    { type: 'object' }
  }}}}
});

const errorResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { type: 'object', properties: {
    status:  { type: 'boolean', example: false },
    message: { type: 'string' },
    error:   { type: 'string' }
  }}}}
});

const buildPaths = () => {
  const paths = {};
  for (const modelName of Object.keys(modelDefinitions)) {
    const base = `/api/dynamic/${modelName.toLowerCase()}s`;
    const tag  = modelName;

    paths[base] = {
      get: {
        tags: [tag], summary: `Get all ${modelName} records`,
        security: [{ TokenAuth: [] }],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { 200: successEnvelope('List retrieved'), 401: errorResponse('Unauthorized') }
      },
      post: {
        tags: [tag], summary: `Create a ${modelName} (admin only)`,
        security: [{ TokenAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: buildSchema(modelDefinitions[modelName]) } } },
        responses: { 201: successEnvelope('Created'), 400: errorResponse('Validation error'), 403: errorResponse('Forbidden') }
      }
    };

    paths[`${base}/{id}`] = {
      get:    { tags: [tag], summary: `Get one ${modelName}`, security: [{ TokenAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successEnvelope('Found'), 404: errorResponse('Not found') } },
      put:    { tags: [tag], summary: `Update a ${modelName} (admin only)`, security: [{ TokenAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: buildSchema(modelDefinitions[modelName]) } } }, responses: { 200: successEnvelope('Updated'), 400: errorResponse('Validation error'), 403: errorResponse('Forbidden'), 404: errorResponse('Not found') } },
      delete: { tags: [tag], summary: `Soft delete a ${modelName} (admin only)`, security: [{ TokenAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successEnvelope('Deleted'), 403: errorResponse('Forbidden'), 404: errorResponse('Not found') } }
    };

    paths[`${base}/{id}/restore`] = {
      patch: { tags: [tag], summary: `Restore a soft-deleted ${modelName} (admin only)`, security: [{ TokenAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successEnvelope('Restored'), 403: errorResponse('Forbidden'), 404: errorResponse('Not found') } }
    };

    paths[`${base}/{id}/audit`] = {
      get: { tags: [tag], summary: `Audit log for a ${modelName}`, security: [{ TokenAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: successEnvelope('Audit entries') } }
    };
  }
  return paths;
};

module.exports = {
  openapi: '3.0.0',
  info: { title: 'Employee Management System API', version: '1.0.0', description: 'Dynamic CRUD, RBAC, audit trails, soft deletes' },
  components: {
    securitySchemes: { TokenAuth: { type: 'apiKey', in: 'header', name: 'x-auth-token' } }
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    ...Object.keys(modelDefinitions).map(n => ({ name: n, description: `${n} CRUD operations` }))
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' }, role: { type: 'string', enum: ['admin', 'user'] } }, required: ['email', 'password'] } } } },
        responses: { 201: successEnvelope('Registered'), 400: errorResponse('Failed') }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login and get JWT token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } }, required: ['email', 'password'] } } } },
        responses: { 200: successEnvelope('Token returned'), 401: errorResponse('Invalid credentials') }
      }
    },
    ...buildPaths()
  }
};