const { test, expect } = require('@playwright/test');
const BASE_URL = 'http://localhost:5173';
const API_URL  = 'http://localhost:5001/api';

let adminToken = '';
let userToken  = '';
let createdId  = '';

async function getToken(email, password) {
  const res  = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return data.data?.token;
}

test.beforeAll(async () => {
  // Register UI test user (regular)
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@ems.com', password: 'testpass123' })
  });
  // Register admin user
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ems.com', password: 'adminpass123', role: 'admin' })
  });
  // Register regular user
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@ems.com', password: 'userpass123', role: 'user' })
  });

  adminToken = await getToken('admin@ems.com', 'adminpass123');
  userToken  = await getToken('user@ems.com',  'userpass123');
});

// ── UI Tests ─────────────────────────────────
test('Login page loads correctly', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await expect(page.locator('h1')).toContainText('Welcome back');
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test('Register page loads correctly', async ({ page }) => {
  await page.goto(`${BASE_URL}/register`);
  await expect(page.locator('h1')).toContainText('Create account');
});

test('Redirects to login when not authenticated', async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard`);
  await expect(page).toHaveURL(/login/);
});

test('Login with valid credentials', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'test@ems.com');
  await page.fill('input[name="password"]', 'testpass123');
  await page.click('button:has-text("Sign In")');
  await expect(page).toHaveURL(/dashboard/);
});

test('Login with invalid credentials shows error', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'wrong@ems.com');
  await page.fill('input[name="password"]', 'wrongpass');
  await page.click('button:has-text("Sign In")');
  await expect(page.locator('.auth-error')).toBeVisible();
});

// ── Structured Response Tests ─────────────────
test('Response envelope has status and message fields', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees`, { headers: { 'x-auth-token': adminToken } });
  const data = await res.json();
  expect(typeof data.status).toBe('boolean');
  expect(typeof data.message).toBe('string');
  expect(data.data).toBeDefined();
});

// ── API CRUD Tests (admin) ────────────────────
test('CREATE employee via API', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
    body: JSON.stringify({ firstName: 'Test', lastName: 'User', email: `test${Date.now()}@company.com`, position: 'QA Engineer', department: 'Engineering' })
  });
  const data = await res.json();
  expect(res.status).toBe(201);
  expect(data.status).toBe(true);
  expect(data.data._id).toBeDefined();
  expect(data.data.firstName).toBe('Test');
  createdId = data.data._id;
});

test('READ all employees via API', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees`, { headers: { 'x-auth-token': adminToken } });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.status).toBe(true);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.meta).toBeDefined();
});

test('UPDATE employee via API', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
    body: JSON.stringify({ firstName: 'Updated', lastName: 'User', email: `updated${Date.now()}@company.com`, position: 'Senior QA', department: 'Engineering' })
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.data.firstName).toBe('Updated');
});

test('DELETE (soft) employee via API', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees/${createdId}`, {
    method: 'DELETE', headers: { 'x-auth-token': adminToken }
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.data.deletedAt).not.toBeNull();
});

test('Deleted employee not in active list', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees`, { headers: { 'x-auth-token': adminToken } });
  const data = await res.json();
  const found = data.data.find(e => e._id === createdId);
  expect(found).toBeUndefined();
});

test('RESTORE soft-deleted employee via API', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees/${createdId}/restore`, {
    method: 'PATCH', headers: { 'x-auth-token': adminToken }
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.data.deletedAt).toBeNull();
});

test('Validation rejects missing required fields', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
    body: JSON.stringify({ firstName: 'Only' })
  });
  const data = await res.json();
  expect(res.status).toBe(400);
  expect(data.status).toBe(false);
  expect(data.error).toBeDefined();
});

test('Validation rejects invalid email', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': adminToken },
    body: JSON.stringify({ firstName: 'Test', lastName: 'User', email: 'not-an-email', position: 'Dev', department: 'IT' })
  });
  const data = await res.json();
  expect(res.status).toBe(400);
  expect(data.error.some(e => e.includes('email'))).toBe(true);
});

test('Audit log created after actions', async () => {
  const res  = await fetch(`${API_URL}/dynamic/employees/${createdId}/audit`, { headers: { 'x-auth-token': adminToken } });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(Array.isArray(data.data)).toBe(true);
  expect(data.data.length).toBeGreaterThan(0);
  expect(['CREATE','UPDATE','DELETE','RESTORE']).toContain(data.data[0].action);
});

// ── RBAC Tests ────────────────────────────────
test('Regular user can READ employees', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`, { headers: { 'x-auth-token': userToken } });
  expect(res.status).toBe(200);
});

test('Regular user cannot CREATE employee', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': userToken },
    body: JSON.stringify({ firstName: 'Test', lastName: 'User', email: 'rbac@test.com', position: 'Dev', department: 'IT' })
  });
  expect(res.status).toBe(403);
});

test('Regular user cannot DELETE employee', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees/${createdId}`, {
    method: 'DELETE', headers: { 'x-auth-token': userToken }
  });
  expect(res.status).toBe(403);
});

test('Unauthenticated request is rejected', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`);
  expect(res.status).toBe(401);
});