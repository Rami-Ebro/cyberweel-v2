import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function loadModule(path, mocks) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const testModule = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((id) => id in mocks ? mocks[id] : require(id), testModule, testModule.exports);
  return testModule.exports;
}

function adminRoute({ sent = true, active = true, allowed = true, trusted = true, authorized = true } = {}) {
  const events = [];
  const route = loadModule('../src/app/api/admin/ambassadors/route.ts', {
    '@/lib/db': { db: { ambassador: { findUnique: async () => ({ id: 'a1', userId: 'u1', status: active ? 'ACTIVE' : 'SUSPENDED', user: { email: 'a@example.com', isActive: active, preferredLanguage: 'ar' } }) } } },
    '@/lib/admin-permissions': { canAdmin: async () => authorized, currentAdminAccess: async () => ({ userId: 'admin' }) },
    '@/lib/accept-collaboration': { decideCollaborationApplication: async () => ({ userId: 'u1', email: 'a@example.com', idempotent: false }) },
    '@/lib/admin-user-profile': {},
    '@/lib/ambassador-rewards': {},
    '@/lib/client-invitation': { sendAmbassadorInvitation: async (...args) => { events.push(['send', ...args]); return { sent, error: sent ? undefined : 'EMAIL_SEND_FAILED' }; } },
    '@/lib/account-invitation-policy': { shouldSendAcceptanceInvitation: () => true },
    '@/lib/request-security': { hasTrustedOrigin: () => trusted, invalidOriginResponse: () => Response.json({}, { status: 403 }), consumeRateLimitSubject: async () => ({ allowed }), rateLimitResponse: () => Response.json({}, { status: 429 }) },
    '@/lib/admin-audit': { writeAdminAudit: async (_, audit) => { events.push(['audit', audit]); } },
  });
  const request = (entity = 'invitation') => ({ json: async () => ({ entity, id: 'a1', status: 'ACCEPTED' }), nextUrl: { origin: 'https://www.cyberweel.com' } });
  return { route, request, events };
}

test('acceptance preserves the created account and explicitly reports failed email', async () => {
  const { route, request } = adminRoute({ sent: false });
  const response = await route.PATCH(request('application'));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).invitationSent, false);
});

test('explicit resend uses the existing ambassador account and records the result', async () => {
  const { route, request, events } = adminRoute();
  const response = await route.PATCH(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).invitationSent, true);
  assert.deepEqual(events[0], ['send', 'u1', 'a@example.com', 'https://www.cyberweel.com', 'ar']);
  assert.equal(events[1][1].metadata.sent, true);
});

test('resend failures are retryable and never returned as success', async () => {
  const { route, request, events } = adminRoute({ sent: false });
  const response = await route.PATCH(request());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).invitationSent, false);
  assert.equal(events[1][1].metadata.sent, false);
});

for (const [name, options, status] of [['suspended', { active: false }, 409], ['rate limited', { allowed: false }, 429], ['foreign origin', { trusted: false }, 403], ['unauthorized', { authorized: false }, 403]]) {
  test(`${name} requests cannot send invitations`, async () => {
    const { route, request, events } = adminRoute(options);
    assert.equal((await route.PATCH(request())).status, status);
    assert.equal(events.length, 0);
  });
}

test('a failed invitation only revokes the new token and preserves older links', async () => {
  const events = [];
  const savedKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'test-key';
  try {
    const { sendAmbassadorInvitation } = loadModule('../src/lib/client-invitation.ts', {
      '@/lib/db': { db: { passwordResetToken: {
        create: async (input) => { events.push(['create', input]); return { id: 'new-token' }; },
        update: async (input) => { events.push(['revoke', input]); },
      } } },
      '@/lib/partner-auth': { fingerprint: () => 'hashed-token' },
      '@/lib/account-invitation-copy': { accountInvitationCopy: () => ({ subject: 'Invite', html: 'link' }) },
      '@/lib/invitation-delivery': { deliverInvitation: async () => ({ sent: false, error: 'EMAIL_SEND_FAILED' }) },
    });
    assert.deepEqual(await sendAmbassadorInvitation('u1', 'a@example.com', 'https://www.cyberweel.com'), { sent: false, error: 'EMAIL_SEND_FAILED' });
    assert.equal(events[0][1].data.tokenHash, 'hashed-token');
    assert.deepEqual(events[1][1].where, { id: 'new-token' });
    assert.ok(events[1][1].data.usedAt instanceof Date);
  } finally {
    if (savedKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = savedKey;
  }
});

function referralRoute({ existingReferral = null, existingUser = null } = {}) {
  const events = [];
  const identity = loadModule('../src/lib/partner-auth.ts', {});
  const db = {
    partnerReferral: { findFirst: async (query) => { events.push(['lookup', query]); return existingReferral; } },
    user: { findFirst: async () => existingUser },
    $transaction: async (action) => action({
      partnerReferral: { create: async ({ data }) => { events.push(['create', data]); return { id: 'r1', ...data, commissionAmount: null }; } },
      adminNotification: { create: async () => ({}) },
    }),
  };
  const route = loadModule('../src/app/api/ambassador/dashboard/route.ts', {
    '@/lib/db': { db }, '@/lib/user-identity': identity,
    '@/lib/admin-permissions': {}, '@/lib/ambassador-rewards': {},
    '@/lib/ambassador-auth': { currentAmbassador: async () => ({ id: 'u1', email: 'ambassador@example.com', phone: '+963999999999', name: 'Ambassador', ambassador: { id: 'a1', referralNumber: 1, profileCompletedAt: new Date() } }) },
    '@/lib/partner-referral': { formatAmbassadorReferralCode: () => 'CWA-0001' },
    '@/lib/request-security': { hasTrustedOrigin: () => true, consumeRateLimit: async () => ({ allowed: true }) },
  });
  const request = (data) => ({ json: async () => ({ name: 'Prospect', needs: 'A website', ...data }) });
  return { route, request, events };
}

test('a phone-only prospect can be recorded without inventing an email or creating a user', async () => {
  const { route, request, events } = referralRoute();
  const response = await route.POST(request({ phone: '+963 988 123 456' }));
  assert.equal(response.status, 201);
  const { referral } = await response.json();
  assert.equal(referral.email, null);
  assert.equal(referral.phone, '+963988123456');
  assert.equal(referral.contactMethod, '+963988123456');
  assert.equal(events.filter(([action]) => action === 'create').length, 1);
});

test('email-only intake remains valid without a second contact channel', async () => {
  const { route, request } = referralRoute();
  assert.equal((await route.POST(request({ email: 'prospect@example.com' }))).status, 201);
});

for (const data of [{}, { phone: '123' }, { email: 'invalid', phone: '+963988123456' }, { email: 'ambassador@example.com' }, { phone: '+963 999 999 999' }]) {
  test(`invalid or self-referral contact is rejected: ${JSON.stringify(data)}`, async () => {
    const { route, request, events } = referralRoute();
    const response = await route.POST(request(data));
    assert.ok([400, 409].includes(response.status));
    assert.equal(events.filter(([action]) => action === 'create').length, 0);
  });
}

for (const existing of [{ existingReferral: { ambassadorId: 'a1' } }, { existingUser: { id: 'u2' } }]) {
  test(`duplicate phone cannot create another referral: ${JSON.stringify(existing)}`, async () => {
    const { route, request, events } = referralRoute(existing);
    assert.equal((await route.POST(request({ phone: '+963988123456' }))).status, 409);
    assert.ok(events[0][1].where.OR.some((condition) => condition.phone?.in.includes('+963988123456')));
    assert.equal(events.filter(([action]) => action === 'create').length, 0);
  });
}

test('password recovery uses the configured contact sender and preserves previous links on failure', async () => {
  const previous = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM, contact: process.env.CONTACT_FROM_EMAIL };
  process.env.RESEND_API_KEY = 'test-key';
  delete process.env.EMAIL_FROM;
  process.env.CONTACT_FROM_EMAIL = 'CyberWeel <verified@example.com>';
  const events = [];
  try {
    const route = loadModule('../src/app/api/partner/forgot-password/route.ts', {
      '@/lib/db': { db: {
        user: { findUnique: async () => ({ id: 'u1', role: 'AMBASSADOR', preferredLanguage: 'ar' }) },
        passwordResetToken: {
          create: async () => ({ id: 'new-recovery-token' }),
          update: async (input) => { events.push(['revoke', input]); },
        },
      } },
      '@/lib/partner-auth': { normalizeEmail: (value) => value.trim().toLowerCase(), fingerprint: () => 'hashed-token' },
      '@/lib/password-access': { canUsePasswordAccess: () => true },
      '@/lib/request-security': { hasTrustedOrigin: () => true, consumeRateLimit: async () => ({ allowed: true }) },
      '@/lib/invitation-delivery': { deliverInvitation: async (message, config) => {
        events.push(['send', config.from]);
        return { sent: false, error: 'EMAIL_SEND_FAILED' };
      } },
    });
    const response = await route.POST({ json: async () => ({ email: 'a@example.com' }), nextUrl: { origin: 'https://www.cyberweel.com' } });
    assert.equal(response.status, 200); // Keep account existence private.
    assert.equal(events[0][1], 'CyberWeel <verified@example.com>');
    assert.deepEqual(events[1][1].where, { id: 'new-recovery-token' });
    assert.equal('resetUrl' in await response.json(), false);
  } finally {
    for (const [key, value] of Object.entries({ RESEND_API_KEY: previous.key, EMAIL_FROM: previous.from, CONTACT_FROM_EMAIL: previous.contact })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
