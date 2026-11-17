'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const { createServer } = require('node:http');
const { randomUUID } = require('node:crypto');
const vm = require('node:vm');
const { PGlite } = require('@electric-sql/pglite');
const { postgres } = require('./database');
const { createHandler, configuration } = require('./index');
const { transfers } = require('./transfers');
const { scope } = require('./estimate');
const M = require('../dist/model');
const Photos = require('../dist/job-photos');
const catalog = require('../pricing/catalog.json');
const origin = 'https://estimator.company.example';
const config = { vercel: true, origin, domain: 'company.example', clientId: 'test-client', clientSecret: 'test-secret', members: new Map([['owner@company.example', 'owner'], ['sales@company.example', 'sales'], ['other@company.example', 'sales']]) };

// PGlite runs PostgreSQL itself in-process. It does not simulate provider networking,
// connection pooling or Vercel routing; those remain deployment acceptance checks.
async function database() {
  const pg = new PGlite();
  const query = async (text, values) => {
    if (!values && text.includes(';')) return (await pg.exec(text)).at(-1);
    return pg.query(text, values);
  };
  const pool = { query, connect: async () => ({ query, release() {} }), end: async () => {} };
  return { db: postgres(pool), finish: () => pg.close(), raw: pg };
}

async function serve(db, sourcePricing = catalog) {
  const handler = await createHandler(config, { database: db, sourcePricing, verifyGoogle: async (code, _, nonce) => ({ email: code + '@company.example', hd: 'company.example', email_verified: true, sub: 'identity-' + code, nonce }) });
  const server = createServer(handler).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = (path, { data, cookie, headers } = {}) => fetch(base + path, {
    redirect: 'manual', method: data === undefined ? 'GET' : 'POST',
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data === undefined ? {} : { Origin: origin, 'Content-Type': 'application/json' }), ...headers },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return { call, base, close: () => new Promise(resolve => server.close(resolve)) };
}

async function expect(response, status) {
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify(data).slice(0, 1000));
  return data;
}

async function login(start, finish, name) {
  const begin = await start.call('/auth/google');
  assert.equal(begin.status, 303);
  const google = new URL(begin.headers.get('Location'));
  const flow = begin.headers.getSetCookie()[0];
  assert.match(flow, /HttpOnly; SameSite=Lax; Max-Age=600; Secure/);
  assert.equal(google.searchParams.get('redirect_uri'), origin + '/auth/google/callback');
  const path = `/auth/google/callback?code=${name}&state=${google.searchParams.get('state')}`;
  const completed = await finish.call(path, { cookie: flow.split(';')[0] });
  const cookie = completed.headers.getSetCookie().find(value => value.startsWith('__Host-livewire-session='));
  assert.ok(cookie);
  assert.match(cookie, /HttpOnly; SameSite=Lax; Max-Age=28800; Secure/);
  assert.equal((await start.call(path, { cookie: flow.split(';')[0] })).headers.get('Location'), '/?signin=denied');
  return cookie.split(';')[0];
}

function client(fetch) {
  const context = vm.createContext({ window: {}, document: { getElementById: () => ({}) }, Blob, fetch, crypto: { randomUUID }, structuredClone, URLSearchParams, location: { reload() {} }, JobPhotos: Photos });
  vm.runInContext(readFileSync(require.resolve('./shared.js'), 'utf8'), context);
  return context.window.LivewireShared;
}

test('Vercel configuration requires HTTPS, durable storage and approved work identities', () => {
  const env = { VERCEL: '1', LIVEWIRE_ORIGIN: origin, DATABASE_URL: 'postgresql://example.invalid/company', LIVEWIRE_GOOGLE_DOMAIN: 'company.example', LIVEWIRE_GOOGLE_CLIENT_ID: 'client', LIVEWIRE_GOOGLE_CLIENT_SECRET: 'secret', LIVEWIRE_MEMBERS: '{"owner@company.example":"owner"}' };
  assert.equal(configuration(env).vercel, true);
  assert.throws(() => configuration({ ...env, DATABASE_URL: '' }), /durable/);
  assert.throws(() => configuration({ ...env, LIVEWIRE_ORIGIN: 'http://127.0.0.1' }), /HTTPS/);
  assert.throws(() => configuration({ ...env, DATABASE_URL: 'file:local.sqlite' }), /PostgreSQL/);
  assert.throws(() => configuration({ ...env, LIVEWIRE_MEMBERS: '{"owner@personal.example":"owner"}' }), /work email/);
});

test('PostgreSQL persists login across instances, rejects stale saves and preserves immutable price releases', async () => {
  const storage = await database();
  const a = await serve(storage.db), b = await serve(storage.db);
  let c;
  try {
    const cookie = await login(a, b, 'sales');
    const owner = await login(b, a, 'owner');
    await expect(await a.call('/api/projects'), 401);
    for (const path of ['/pricing/catalog.json', '/dist/model.js', '/.env', '/server/database.js', '/distribution/Livewire-Lighting-Budget.html']) await expect(await a.call(path), 404);
    const state = M.initial();
    state.project.name = 'Client 100%_one'; state.project.travelBand = '0';
    const room = M.addRoomNamed(state, 'Kitchen');
    room.recessGroups[0].qty = 4;
    Object.assign(room, { surfaceMaterial: 'open', ceilingPath: 'open', wallPath: 'open' });
    const saved = await expect(await a.call('/api/projects', { cookie, data: { scope: state } }), 201);
    assert.equal(saved.release, catalog.catalogVersion);
    assert.equal((await expect(await b.call('/api/projects/' + saved.id, { cookie }), 200)).scope.rooms[0].recessGroups[0].qty, 4);
    const listing = await expect(await b.call('/api/projects?q=100%25_', { cookie }), 200);
    assert.equal(listing.projects.length, 1); assert.ok(listing.projects[0].updatedAt);
    assert.equal((await expect(await b.call('/api/projects?q=100%25x', { cookie }), 200)).projects.length, 0);
    const path = '/api/projects/' + saved.id;
    const raced = await Promise.all([a.call(path, { cookie, data: { scope: state, revision: 1 } }), b.call(path, { cookie, data: { scope: state, revision: 1 } })]);
    assert.deepEqual(raced.map(r => r.status).sort(), [200, 409]);
    const budget = await expect(await b.call('/api/estimate', { cookie, data: { scope: state, id: saved.id } }), 200);
    assert.ok(Array.isArray(budget.requirements), 'Hosted navigation receives the same requirements as standalone');
    const newer = structuredClone(catalog); newer.catalogVersion += '-hosted-test';
    await expect(await a.call('/api/pricing', { cookie, data: { file: newer, validated: true } }), 403);
    await expect(await a.call('/api/pricing', { cookie: owner, data: { file: newer, validated: true } }), 201);
    c = await serve(storage.db); // A fresh instance must not reset the active catalog.
    assert.equal((await expect(await c.call('/api/bootstrap', { cookie }), 200)).currentRelease, newer.catalogVersion);
    assert.equal((await expect(await c.call(path, { cookie }), 200)).release, catalog.catalogVersion);
    const changed = structuredClone(catalog); changed.settings.catalog[0].cost += 1;
    await assert.rejects(() => createHandler(config, { database: storage.db, sourcePricing: changed }), /version has already been used/);
    const names = await storage.raw.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    assert.ok(names.rows.every(row => row.tablename.startsWith('lw_estimator_')));
    await expect(await c.call('/api/logout', { cookie, data: {} }), 200);
    await expect(await a.call('/api/bootstrap', { cookie }), 401);
  } finally { await a.close(); await b.close(); if (c) await c.close(); await storage.finish(); }
});

test('photo-heavy shared jobs use small requests, stream back intact and survive failed or conflicting saves', async () => {
  const storage = await database();
  const a = await serve(storage.db), b = await serve(storage.db);
  try {
    const cookie = await login(a, b, 'sales');
    const other = await login(b, a, 'other');
    const state = M.initial(); state.project.name = 'Estate photo and notes transfer';
    for (let i = 0; i < 500; i++) {
      const room = M.room('Room ' + i, 'new');
      room.notes = 'Internal room notes '.padEnd(2000, 'x');
      if (i < 3) room.photos = Array.from({ length: 8 }, (_, n) => ({ id: 'photo-' + i + '-' + n, name: 'Internal-room-photo.jpg', data: 'data:image/jpeg;base64,/9j/' + 'A'.repeat(149972) }));
      state.rooms.push(room);
    }
    const clean = scope(state);
    const encoded = JSON.stringify({ scope: clean });
    assert.ok(Buffer.byteLength(encoded) > 4500000 && Buffer.byteLength(encoded) < 8000000);
    const sent = [];
    let failPart = false;
    const shared = client(async (path, options) => {
      const data = options?.body ? JSON.parse(options.body) : undefined;
      if (options?.body) { const bytes = Buffer.byteLength(options.body); sent.push(bytes); assert.ok(bytes < 3500000); }
      if (failPart && /\/uploads\/.*\/1$/.test(path)) throw Error('Upload interrupted for test');
      return a.call(path, { cookie, data });
    });
    let result;
    const notices = [];
    const context = { state: clean, replace: value => { result = value; }, status() {}, toast: value => notices.push(value) };
    await shared.action('export', context);
    assert.equal(notices.at(-1), 'Saved to shared projects.');
    assert.ok(sent.length > 10); assert.deepEqual(JSON.parse(JSON.stringify(result)), clean);
    const list = await expect(await b.call('/api/projects', { cookie: other }), 200);
    const path = '/api/projects/' + list.projects[0].id;
    const reopened = await b.call(path, { cookie: other });
    assert.equal(reopened.headers.get('transfer-encoding'), 'chunked');
    const row = await expect(reopened, 200);
    assert.deepEqual(row.scope, clean);
    let handoff;
    context.estimatorReport = value => { handoff = value; };
    await shared.action('estimator-pdf', context);
    assert.equal(handoff.type, 'estimator-handoff');
    assert.equal(handoff.rooms.length, 500);
    assert.equal(handoff.rooms[0].photos.length, 8);
    assert.equal(handoff.rooms[0].notes, clean.rooms[0].notes);

    await expect(await a.call(path, { cookie, data: { scope: clean, revision: 1 } }), 413);
    assert.equal((await expect(await b.call(path, { cookie }), 200)).revision, 1);
    context.state.project.name = 'Changed after reopening';
    failPart = true;
    await shared.action('export', context);
    assert.equal(notices.at(-1), 'Upload interrupted for test');
    assert.equal((await expect(await b.call(path, { cookie }), 200)).revision, 1);
    failPart = false;
    await shared.action('export', context);
    assert.equal(notices.at(-1), 'Saved to shared projects.');
    assert.equal((await expect(await b.call(path, { cookie }), 200)).revision, 2);

    // Upload ownership, target binding, completeness, expiry and one-use protection.
    const text = JSON.stringify({ scope: { schema: 2 } });
    const begin = () => a.call('/api/uploads', { cookie, data: { target: '/api/import', parts: 1, bytes: Buffer.byteLength(text) } }).then(r => expect(r, 201));
    let upload = await begin();
    await expect(await a.call(`/api/uploads/${upload.id}/0`, { cookie: other, data: { text } }), 404);
    await expect(await a.call(`/api/uploads/${upload.id}/0`, { cookie, data: { text } }), 200);
    await expect(await a.call('/api/projects', { cookie, data: { transferId: upload.id } }), 404);
    await expect(await a.call('/api/import', { cookie: other, data: { transferId: upload.id } }), 404);
    assert.deepEqual(await transfers(storage.db).consume('sales@company.example', '/api/import', upload.id), JSON.parse(text));
    await expect(await a.call('/api/import', { cookie, data: { transferId: upload.id } }), 404);
    upload = await begin();
    await expect(await a.call('/api/import', { cookie, data: { transferId: upload.id } }), 422);
    upload = await begin();
    await storage.db.prepare('UPDATE uploads SET expires = 0 WHERE id = ?').run(upload.id);
    await expect(await a.call(`/api/uploads/${upload.id}/0`, { cookie, data: { text } }), 404);
    await expect(await a.call('/api/uploads', { cookie, data: { target: '/api/pricing', parts: 1, bytes: 1 } }), 422);
  } finally { await a.close(); await b.close(); await storage.finish(); }
});

test('client transfer preserves surrogate pairs at a chunk boundary', async () => {
  const state = { schema: 2, project: { name: '' }, rooms: [], archivedRooms: [] };
  const prefix = JSON.stringify({ scope: state }).indexOf('"name":"') + '"name":"'.length;
  // Transport-only fixture; normal form limits are separately enforced by the API.
  state.project.name = 'a'.repeat(499999 - prefix) + '💡' + 'a'.repeat(2600000);
  const parts = [];
  let declared, returned;
  const shared = client(async (path, options) => {
    const data = JSON.parse(options.body);
    if (path === '/api/uploads') { declared = data; return Response.json({ id: 'upload' }); }
    if (path.startsWith('/api/uploads/')) {
      // A UTF-8 round trip reproduces a PostgreSQL text transport boundary.
      parts.push(Buffer.from(data.text, 'utf8').toString('utf8'));
      return Response.json({});
    }
    returned = JSON.parse(parts.join(''));
    return Response.json({ id: randomUUID(), revision: 1, release: 'test', scope: returned.scope });
  });
  await shared.action('export', { state, replace() {}, status() {}, toast: message => assert.equal(message, 'Saved to shared projects.') });
  assert.equal(declared.parts, parts.length);
  assert.equal(declared.bytes, Buffer.byteLength(parts.join('')));
  assert.equal(returned.scope.project.name, state.project.name);
});

test('unconfigured serverless entry point fails closed', async () => {
  const handler = require('../api');
  const before = process.env.VERCEL;
  process.env.VERCEL = '1';
  const server = createServer(handler).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/pricing');
    const result = await expect(response, 503);
    assert.match(result.error, /not configured/);
    assert.doesNotMatch(JSON.stringify(result), /cost|postgresql|password/i);
  } finally { await new Promise(resolve => server.close(resolve)); if (before === undefined) delete process.env.VERCEL; else process.env.VERCEL = before; }
});
