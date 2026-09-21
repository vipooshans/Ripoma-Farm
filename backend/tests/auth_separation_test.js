const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5050';

async function runTests() {
  console.log('🧪 Starting RIPOMA Farm - Admin vs Customer Separation Verification Suite\n');
  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      testsPassed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      testsFailed++;
    }
  };

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Customer Password Length Validation (< 8 chars rejected)
    // ------------------------------------------------------------------------
    console.log('--- 1. Customer Password Policy (< 8 chars rejected) ---');
    const res1 = await fetch(`${BASE_URL}/api/v1/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass Customer',
        email: `shortpass_${Date.now()}@example.com`,
        password: '123'
      })
    });
    assert(res1.status === 400, 'Customer registration with < 8 chars returns 400 Bad Request');

    // ------------------------------------------------------------------------
    // TEST 2: Customer Registration & Token Issuance (15m access / 7d refresh)
    // ------------------------------------------------------------------------
    console.log('\n--- 2. Customer Registration & Token Issuance ---');
    const testEmail = `farmer_${Date.now()}@testfarm.com`;
    const res2 = await fetch(`${BASE_URL}/api/v1/auth/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Organic Customer John',
        email: testEmail,
        password: 'StrongCustomerPass123!',
        phone: '+1 555-987-6543'
      })
    });
    const customerData = await res2.json();
    assert(res2.status === 201, 'Customer registered with HTTP 201');
    assert(customerData.role === 'customer', 'Customer role claim is explicitly "customer"');
    assert(!!customerData.token && !!customerData.refreshToken, 'Customer access & refresh tokens issued');

    // ------------------------------------------------------------------------
    // TEST 3: Customer Login Flow
    // ------------------------------------------------------------------------
    console.log('\n--- 3. Customer Login Flow ---');
    const res3 = await fetch(`${BASE_URL}/api/v1/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'StrongCustomerPass123!'
      })
    });
    const customerLoginData = await res3.json();
    assert(res3.status === 200, 'Customer login succeeded with HTTP 200');
    assert(customerLoginData.role === 'customer', 'Customer logged in identity is "customer"');

    // ------------------------------------------------------------------------
    // TEST 4: Customer Token Replay Guard against Protected Admin Routes
    // ------------------------------------------------------------------------
    console.log('\n--- 4. Customer Token vs Admin Route Guard (Isolation) ---');
    const res4 = await fetch(`${BASE_URL}/api/workers`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerLoginData.token}` }
    });
    assert(
      res4.status === 401 || res4.status === 403,
      `Customer token rejected on Admin route with status ${res4.status}`
    );

    // ------------------------------------------------------------------------
    // TEST 5: No Public Admin Registration Route
    // ------------------------------------------------------------------------
    console.log('\n--- 5. No Public Admin Registration Endpoint ---');
    const res5 = await fetch(`${BASE_URL}/api/v1/auth/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: 'hacker@ripomafarm.com',
        password: 'Password@1234'
      })
    });
    assert(res5.status === 404, 'Public admin registration returns 404 Not Found');

    // ------------------------------------------------------------------------
    // TEST 6: Admin Login Step 1 (Credentials -> 2FA Temp Token)
    // ------------------------------------------------------------------------
    console.log('\n--- 6. Admin Login Step 1 (Credentials -> 2FA Temp Token) ---');
    let res6 = await fetch(`${BASE_URL}/api/v1/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ripomafarm.com',
        password: 'Admin@1234'
      })
    });
    let adminStep1 = await res6.json();
    if (res6.status !== 200) {
      // Try seed super admin env password fallback
      res6 = await fetch(`${BASE_URL}/api/v1/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@ripomafarm.com',
          password: 'Admin@Ripoma2026!'
        })
      });
      adminStep1 = await res6.json();
    }
    assert(res6.status === 200, 'Admin step 1 login returned HTTP 200');
    assert(adminStep1.require2FA === true, 'Admin login enforces require2FA === true');
    assert(!!adminStep1.tempToken, 'Admin login issues short-lived temp 2FA challenge token');
    const temp2FAToken = adminStep1.tempToken;

    // ------------------------------------------------------------------------
    // TEST 7: Admin Login Step 2 (2FA Verification -> Role Claims & Tokens)
    // ------------------------------------------------------------------------
    console.log('\n--- 7. Admin Login Step 2 (2FA Verification) ---');
    const res7 = await fetch(`${BASE_URL}/api/v1/auth/admin/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tempToken: temp2FAToken,
        code: '123456'
      })
    });
    const adminSession = await res7.json();
    assert(res7.status === 200, '2FA verification succeeded with HTTP 200');
    assert(adminSession.role === 'super_admin' || adminSession.role === 'admin', `Admin role claim is "${adminSession.role}"`);
    assert(Array.isArray(adminSession.permissions) && adminSession.permissions.length > 0, 'Admin token contains explicit permissions claims');
    assert(!!adminSession.token && !!adminSession.refreshToken, 'Admin access and refresh tokens issued');

    // ------------------------------------------------------------------------
    // TEST 8: Admin Authenticated Access to Admin Management
    // ------------------------------------------------------------------------
    console.log('\n--- 8. Admin Authorized Access to Admin Routes ---');
    const res8 = await fetch(`${BASE_URL}/api/workers`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminSession.token}` }
    });
    const workers = await res8.json();
    assert(res8.status === 200, 'Admin successfully accesses /api/workers with Admin JWT');
    assert(Array.isArray(workers), 'Workers list returned to authorized admin');

    // ------------------------------------------------------------------------
    // TEST 9: Customer Token Refresh Flow
    // ------------------------------------------------------------------------
    console.log('\n--- 9. Customer Token Refresh Flow ---');
    const res9 = await fetch(`${BASE_URL}/api/v1/auth/customer/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: customerData.refreshToken
      })
    });
    const refreshedCustomer = await res9.json();
    assert(res9.status === 200, 'Customer refresh token returned new access token');
    assert(!!refreshedCustomer.token, 'New Customer access token present');

    // ------------------------------------------------------------------------
    // TEST 10: Admin Token Refresh Flow
    // ------------------------------------------------------------------------
    console.log('\n--- 10. Admin Token Refresh Flow ---');
    const res10 = await fetch(`${BASE_URL}/api/v1/auth/admin/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: adminSession.refreshToken
      })
    });
    const refreshedAdmin = await res10.json();
    assert(res10.status === 200, 'Admin refresh token returned new access token');
    assert(!!refreshedAdmin.token, 'New Admin access token present');

    // ------------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`🎯 Test Results: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log(`========================================\n`);

    if (testsFailed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Fatal test error:', globalErr);
    process.exit(1);
  }
}

runTests();
