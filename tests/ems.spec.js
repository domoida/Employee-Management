const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const API_URL  = 'http://localhost:5001/api';

let token = '';
let createdId = '';

// ── Helper: get auth token ───────────────────
async function getToken() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@ems.com', password: 'testpass123' })
  });
  const data = await res.json();
  return data.token;
}

// ── Setup: register test user once ──────────
test.beforeAll(async () => {
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@ems.com', password: 'testpass123' })
  });
  token = await getToken();
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

// ── API CRUD Tests ───────────────────────────

test('CREATE employee via API', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify({
      firstName: 'Test', lastName: 'User',
      email: `test${Date.now()}@company.com`,
      position: 'QA Engineer', department: 'Engineering'
    })
  });
  const data = await res.json();
  expect(res.status).toBe(201);
  expect(data._id).toBeDefined();
  expect(data.firstName).toBe('Test');
  createdId = data._id;
});

test('READ all employees via API', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`, {
    headers: { 'x-auth-token': token }
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(Array.isArray(data)).toBe(true);
});

test('UPDATE employee via API', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees/${createdId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify({
      firstName: 'Updated', lastName: 'User',
      email: `updated${Date.now()}@company.com`,
      position: 'Senior QA', department: 'Engineering'
    })
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.firstName).toBe('Updated');
});

test('DELETE (soft) employee via API', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees/${createdId}`, {
    method: 'DELETE',
    headers: { 'x-auth-token': token }
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.record.deletedAt).not.toBeNull();
});

test('Deleted employee not in active list', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`, {
    headers: { 'x-auth-token': token }
  });
  const data = await res.json();
  const found = data.find(e => e._id === createdId);
  expect(found).toBeUndefined();
});

test('RESTORE soft-deleted employee via API', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees/${createdId}/restore`, {
    method: 'PATCH',
    headers: { 'x-auth-token': token }
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.deletedAt).toBeNull();
});

test('Validation rejects missing required fields', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify({ firstName: 'Only' })
  });
  const data = await res.json();
  expect(res.status).toBe(400);
  expect(data.errors).toBeDefined();
});

test('Validation rejects invalid email', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
    body: JSON.stringify({
      firstName: 'Test', lastName: 'User',
      email: 'not-an-email',
      position: 'Dev', department: 'IT'
    })
  });
  const data = await res.json();
  expect(res.status).toBe(400);
  expect(data.errors.some(e => e.includes('email'))).toBe(true);
});

test('Audit log created after actions', async () => {
  const res = await fetch(`${API_URL}/dynamic/employees/${createdId}/audit`, {
    headers: { 'x-auth-token': token }
  });
  const data = await res.json();
  expect(res.status).toBe(200);
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
  expect(['CREATE','UPDATE','DELETE','RESTORE']).toContain(data[0].action);
});
