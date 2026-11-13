'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const { createApp } = require('./index');
const M = require('../dist/model');
const P = require('../dist/pricing');

const origin = 'http://localhost:8787';
const domain = 'company.example';
const config = { origin, domain, clientId: 'test-client', clientSecret: 'test-secret', members: new Map([['david@company.example', 'owner'], ['sales@company.example', 'sales'], ['sales2@company.example', 'sales']]) };

async function start(dbPath, sourcePricing) {
  const app = createApp({ ...config, dbPath }, { sourcePricing, verifyGoogle: async (code, _, nonce) => ({
    email: code === 'wrong-domain' ? 'sales@company.example' : `${code}@company.example`,
    email_verified: true, hd: code === 'wrong-domain' ? 'elsewhere.example' : domain, sub: `test-${code}`, nonce,
  }) });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  const base = `http://127.0.0.1:${app.address().port}`;
  const call = (path, { data, cookie, headers } = {}) => fetch(base + path, {
    method: data === undefined ? 'GET' : 'POST', redirect: 'manual',
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data === undefined ? {} : { Origin: origin, 'Content-Type': 'application/json' }), ...headers },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  async function login(code, stateOverride) {
    const begin = await call('/auth/google');
    const state = new URL(begin.headers.get('Location')).searchParams.get('state');
    const flowCookie = begin.headers.getSetCookie()[0].split(';')[0];
    const result = await call(`/auth/google/callback?code=${code}&state=${stateOverride || state}`, { cookie: flowCookie });
    assert.equal(result.status, 303);
    return result.headers.getSetCookie().find(value => value.startsWith('livewire-dev-session='))?.split(';')[0];
  }
  return { call, login, close: () => new Promise(resolve => app.close(resolve)) };
}

function readyPricing(version) {
  const state = M.initial();
  for (const item of state.config.catalog) {
    item.cost = 251.37;
    item.sku = 'PRIVATE-TEST-SKU';
    item.verified = true;
  }
  state.config.rangeLowPct = 5;
  state.config.rangeHighPct = 15;
  return P.make(state, version, '2026-11-11');
}

async function expect(response, status) {
  const value = await response.json();
  assert.equal(response.status, status, JSON.stringify(value));
  return value;
}

test('employee sessions, private pricing, shared revisions and reviewed customer output', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'livewire-estimator-'));
  const database = join(directory, 'estimator.sqlite');
  let server = await start(database);
  try {
    const { call, login } = server;
    await expect(await call('/api/projects'), 401);
    await expect(await call('/dist/model.js'), 404);
    await expect(await call('/model.js'), 404);
    assert.equal(await login('wrong-domain'), undefined);
    assert.equal(await login('unknown'), undefined);
    assert.equal(await login('sales', 'invalid-state'), undefined);
    const sales = await login('sales');
    const sales2 = await login('sales2');
    const owner = await login('david');
    assert.ok(owner && sales && sales2);
    const state = M.initial();
    state.project.name = 'Shared kitchen';
    state.project.travelBand = '0';
    const room = M.addRoomNamed(state, 'Kitchen');
    room.surfaceMaterial = room.surfaceAccess = 'open';Object.assign(room,{ceilingPath:'open',wallPath:'open',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'});state.project.sharedPath='open';
    room.recessGroups[0].qty = 4;
    const boot = await expect(await call('/api/bootstrap', { cookie: sales }), 200);
    assert.ok(!Object.hasOwn(boot.project, 'config'));
    const release = readyPricing('verified-test-1');
    assert.equal((await expect(await call('/api/pricing', { cookie: sales }), 200)).release.catalogVersion, 'preliminary-baseline');
    await expect(await call('/api/pricing', { cookie: sales, data: { file: release, validated: true } }), 403);
    await expect(await call('/api/pricing', { cookie: owner, data: { file: release, validated: true }, headers: { Origin: 'https://elsewhere.example' } }), 403);
    const initial = await expect(await call('/api/projects', { cookie: sales, data: { scope: state } }), 201);
    assert.equal(initial.release, 'preliminary-baseline');
    assert.ok(!Object.hasOwn(initial.scope, 'config'));
    await expect(await call('/api/pricing', { cookie: owner, data: { file: release, validated: true } }), 201);
    const url = `/api/projects/${initial.id}`;
    const shared = await expect(await call(url, { cookie: sales2 }), 200);
    assert.equal(shared.scope.project.name, 'Shared kitchen');
    const preview = async (scope = shared.scope) => expect(await call('/api/estimate', { cookie: sales, data: { id: initial.id, scope } }), 200);
    const pending = await preview();
    assert.equal(pending.report.range, null);
    assert.equal(pending.release, 'preliminary-baseline');
    await expect(await call(`${url}/reprice`, { cookie: sales, data: { revision: initial.revision } }), 403);
    const repriced = await expect(await call(`${url}/reprice`, { cookie: owner, data: { revision: initial.revision } }), 200);
    assert.equal(repriced.release, 'verified-test-1');
    await expect(await call(url, { cookie: sales2, data: { revision: initial.revision, scope: shared.scope } }), 409);
    shared.scope.project.scopeReviewed = true;
    shared.scope.config = { catalog: [] };
    assert.equal((await preview()).report.range, null);
    await expect(await call(`${url}/review`, { cookie: sales, data: { reviewed: true, revision: repriced.revision } }), 403);
    const approved = await expect(await call(`${url}/review`, { cookie: owner, data: { reviewed: true, revision: repriced.revision } }), 200);
    const reviewed = await preview();
    assert.ok(reviewed.report.range.low > 0);
    assert.doesNotMatch(JSON.stringify(reviewed), /251\.37|PRIVATE-TEST-SKU|materialCost|smallMargin|catalog/);
    const approvedRange = reviewed.report.range;
    await expect(await call('/api/pricing', { cookie: owner, data: { file: readyPricing('verified-test-2'), validated: true } }), 201);
    assert.deepEqual((await preview()).report.range, approvedRange);
    assert.equal((await preview()).release, 'verified-test-1');
    shared.scope.rooms[0].recessGroups[0].qty = 5;
    assert.equal((await preview()).report.range, null);
    const saved = await expect(await call(url, { cookie: sales, data: { revision: approved.revision, scope: shared.scope } }), 200);
    assert.equal(saved.approved, false);
    await expect(await call('/api/logout', { cookie: sales, data: {} }), 200);
    await expect(await call(url, { cookie: sales }), 401);
    await server.close();
    server = await start(database);
    const reopened = await expect(await server.call(url, { cookie: await server.login('sales2') }), 200);
    assert.equal(reopened.scope.rooms[0].recessGroups[0].qty, 5);
  } finally {
    await server.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('sales templates, RF layout approval, and existing-system holds', async () => {
  const server = await start(':memory:');
  try {
    const { call, login } = server;
    const sales = await login('sales');
    const owner = await login('david');
    const boot = await expect(await call('/api/bootstrap', { cookie: sales }), 200);
    assert.equal(boot.project.project.system, 'unsure');
    assert.deepEqual([boot.rooms.new.powerPlan, boot.rooms.new.controlLocation, boot.rooms.new.keypadLocation], ['new', 'new', 'new']);
    assert.equal(boot.rooms.new.loadTopology, 'distributed');
    const pricing = readyPricing('field-test');
    Object.assign(pricing.settings, { shippingHandling: true, rangeLowPct: -10, rangeHighPct: 15 });
    await expect(await call('/api/pricing', { cookie: owner, data: { file: pricing, validated: true } }), 201);
    assert.equal((await call('/api/pricing?format=csv', { cookie: sales })).status, 200);
    const csv = await call('/api/pricing?format=csv', { cookie: owner });
    assert.equal(csv.status, 200);
    assert.match(await csv.text(), /driver_lumaris_hw/);

    const draft = boot.project;
    Object.assign(draft.project, { name: 'Maple House', system: 'RA3', systemPlan: 'new', install: 'new', travelBand: '1' });
    draft.project.sharedPath='open';
    draft.rooms = [{ ...boot.rooms.new, surfaceMaterial: 'open', surfaceAccess: 'open',ceilingPath:'open',wallPath:'open',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard' }];
    const [room] = draft.rooms;
    room.recessGroups[0].qty = 6;
    room.recessGroups[0].behavior = 'lumaris';
    Object.assign(room, { linearFt: 20, linearZones: 2, linearZoneLengths: '18, 2', linearBehavior: 'lumaris' });
    room.shadeGroups.push({ ...M.Shade.group(M.uid), widthFt: 4, heightFt: 5, qty: 2 });
    const saved = await expect(await call('/api/projects', { cookie: sales, data: { scope: draft } }), 201);
    const found = await expect(await call('/api/projects?q=maple', { cookie: sales }), 200);
    assert.deepEqual(found.projects.map(project => project.name), ['Maple House']);
    const missing = await expect(await call('/api/projects?q=cedar', { cookie: sales }), 200);
    assert.deepEqual(missing.projects, []);
    const url = `/api/projects/${saved.id}`;
    const review = data => call(`${url}/review`, { cookie: owner, data: { revision: saved.revision, reviewed: true, ...data } });
    const shadePrices = { [room.shadeGroups[0].id]: 1321.34 };
    const design = { ra3Processors: 2, ra3Repeaters: 1 };
    await expect(await review({ shadeQuotes: true }), 422);
    await expect(await review({ design, shadePrices }), 422);
    const missingQuote = await expect(await review({ shadeQuotes: true, design }), 422);
    assert.match(missingQuote.error, /current material selling price/);
    const approved = await expect(await review({ shadeQuotes: true, design, shadePrices, permitAllowance: 240 }), 200);
    const amount = await expect(await call('/api/estimate', { cookie: sales, data: { id: saved.id, scope: approved.scope } }), 200);
    assert.ok(amount.report.range.low > 0);
    assert.equal(amount.report.range.designRetainer, Math.round(amount.report.range.low * 4) / 100);
    assert.doesNotMatch(JSON.stringify(amount), /1321\.34|shadePrices|permitAllowance/);
    assert.equal(amount.summary.plan.processors, 2);
    assert.equal(amount.summary.plan.repeaters, 1);
    assert.equal(amount.summary.rooms[0].keypadQty, 1);
    assert.equal(amount.summary.plan.crewDays >= 2, true);
    assert.doesNotMatch(JSON.stringify(amount), /PRIVATE-TEST-SKU|251\.37|materialCost|smallMargin/);

    const extension = { ...approved.scope, project: { ...approved.scope.project, systemPlan: 'existing' } };
    const revised = await expect(await call(url, { cookie: sales, data: { scope: extension, revision: approved.revision } }), 200);
    const pending = await expect(await call('/api/estimate', { cookie: sales, data: { id: saved.id, scope: extension } }), 200);
    assert.equal(pending.report.range, null);
    assert.match(pending.summary.warnings.join(' '), /spare capacity/);
    await expect(await call(`${url}/review`, { cookie: owner, data: { revision: revised.revision, reviewed: true, shadeQuotes: true, design: { ra3Processors: 1, ra3Repeaters: 0 } } }), 422);

    const homeWorks = structuredClone(draft);
    Object.assign(homeWorks.project, { name: 'HomeWorks mixed test', system: 'HomeWorks' });
    homeWorks.rooms[0].shadeGroups[0].family = 'palladiom_wired';
    homeWorks.rooms[0].shadeGroups[0].power = 'existing';
    homeWorks.rooms[0].shadeGroups[0].qsControlCableExisting = true;
    homeWorks.rooms[0].shadeQSBackboneExisting = true;
    const wiredJob = await expect(await call('/api/projects', { cookie: sales, data: { scope: homeWorks } }), 201);
    const wiredApproval = await expect(await call(`/api/projects/${wiredJob.id}/review`, {
      cookie: owner,
      data: { revision: wiredJob.revision, reviewed: true, shadeQuotes: true, shadePrices, design: { hwArchitecture: 'dual', hwCoverage: 1 } },
    }), 200);
    const wiredEstimate = await expect(await call('/api/estimate', { cookie: sales, data: { id: wiredJob.id, scope: wiredApproval.scope } }), 200);
    assert.equal(wiredEstimate.summary.plan.processors, 2);
    assert.equal(wiredEstimate.summary.plan.gateways, 0);
    assert.ok(wiredEstimate.report.range.low > 0);
  } finally { await server.close(); }
});

test('room photos are retained on the saved job and excluded from the customer report', async () => {
  const server = await start(':memory:');
  try {
    const { call, login } = server;
    const sales = await login('sales');
    const owner = await login('david');
    await expect(await call('/api/pricing', { cookie: owner, data: { file: readyPricing('photo-test'), validated: true } }), 201);
    const state = M.initial();
    state.project.travelBand = '0';
    const room = M.addRoomNamed(state, 'Kitchen');
    room.surfaceMaterial = room.surfaceAccess = 'open';Object.assign(room,{ceilingPath:'open',wallPath:'open',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'});state.project.sharedPath='open';
    room.recessGroups[0].qty = 2;
    room.notes = 'Internal reference for estimating';
    const created = await expect(await call('/api/projects', { cookie: sales, data: { scope: state } }), 201);
    const path = `/api/projects/${created.id}`;
    const approved = await expect(await call(`${path}/review`, { cookie: owner, data: { revision: created.revision, reviewed: true } }), 200);
    const photo = { id: 'site-photo', name: 'Internal-photo.jpg', data: 'data:image/jpeg;base64,/9j/2Q==' };
    approved.scope.rooms[0].photos = [photo];
    const updated = await expect(await call(path, { cookie: sales, data: { scope: approved.scope, revision: approved.revision } }), 200);
    assert.equal(updated.approved, true);
    const reopened = await expect(await call(path, { cookie: await login('sales2') }), 200);
    assert.deepEqual(reopened.scope.rooms[0].photos, [photo]);
    const estimateScope = require('../dist/job-photos').withoutPhotos(reopened.scope);
    const { report } = await expect(await call('/api/estimate', { cookie: sales, data: { id: created.id, scope: estimateScope } }), 200);
    assert.ok(report.range.low > 0);
    assert.doesNotMatch(JSON.stringify(report), /Internal.photo|Internal reference|base64/);
    reopened.scope.rooms[0].photos[0].data = 'data:image/svg+xml,<svg/>';
    await expect(await call(path, { cookie: sales, data: { scope: reopened.scope, revision: updated.revision } }), 422);
  } finally { await server.close(); }
});


test('repository catalog registers once and is visible only after employee sign-in', async () => {
  const catalog = require('../pricing/catalog.json');
  const directory = mkdtempSync(join(tmpdir(), 'livewire-repository-pricing-'));
  const dbPath = join(directory, 'estimator.sqlite');
  let server;
  try {
    server = await start(dbPath, catalog);
    await expect(await server.call('/api/pricing'), 401);
    assert.equal((await server.call('/pricing/catalog.json')).status, 404);
    const sales = await server.login('sales');
    const published = await expect(await server.call('/api/pricing', { cookie: sales }), 200);
    assert.equal(published.release.catalogVersion, catalog.catalogVersion);
    assert.ok(published.release.settings.catalog.some(row => row.cost > 0));
    await expect(await server.call('/api/pricing', { cookie: sales, data: { file: catalog, validated: true } }), 403);
    await server.close();
    server = null;
    const changed = structuredClone(catalog);
    changed.settings.catalog[0].cost += 1;
    assert.throws(() => createApp({ ...config, dbPath }, { sourcePricing: changed }), /version has already been used/);
    server = await start(dbPath, catalog);
    const reopened = await server.login('sales');
    assert.equal((await expect(await server.call('/api/bootstrap', { cookie: reopened }), 200)).currentRelease, catalog.catalogVersion);
  } finally {
    if (server) await server.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('access restrictions block approval and a changed installation method clears old approval', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'livewire-access-'));
  const server = await start(join(directory,'estimator.sqlite'),readyPricing('routing-test-1'));
  try {
    const owner=await server.login('david');
    const state=M.initial();Object.assign(state.project,{travelBand:'0',sharedPath:'open'});
    const room=M.addRoomNamed(state,'Finished study');room.recessGroups[0].qty=4;
    Object.assign(room,{surfaceMaterial:'drywall',ceilingPath:'closed',wallPath:'closed',ceilingFishing:'blocked',wallFishing:'blocked',openingPermission:'none',occupancy:'vacant',ceilingHeight:'standard',specialConditions:'standard'});
    let saved=await expect(await server.call('/api/projects',{cookie:owner,data:{scope:state}}),201);
    const path='/api/projects/'+saved.id;
    const blocked=await expect(await server.call(path+'/review',{cookie:owner,data:{revision:saved.revision,reviewed:true}}),422);
    assert.ok(blocked.issues.some(message=>/blocked/.test(message)));
    room.openingPermission='selective';
    saved=await expect(await server.call(path,{cookie:owner,data:{scope:state,revision:saved.revision}}),200);
    const approved=await expect(await server.call(path+'/review',{cookie:owner,data:{revision:saved.revision,reviewed:true}}),200);
    const reviewed=await expect(await server.call('/api/estimate',{cookie:owner,data:{scope:state,id:saved.id}}),200);
    assert.ok(reviewed.report.range);
    assert.match(JSON.stringify(reviewed.report.rooms),/Selective drywall/);
    assert.doesNotMatch(JSON.stringify(reviewed.report),/PRIVATE-TEST-SKU|hoursPer|materialCost/);
    room.openingPermission='none';
    saved=await expect(await server.call(path,{cookie:owner,data:{scope:state,revision:approved.revision}}),200);
    const result=await expect(await server.call('/api/estimate',{cookie:owner,data:{scope:state,id:saved.id}}),200);
    assert.equal(result.report.range,null);assert.ok(result.summary.warnings.some(message=>/blocked/.test(message)));
    assert.ok(result.labor.some(line=>/branch wiring/.test(line.name)));
  } finally { await server.close();rmSync(directory,{recursive:true,force:true}); }
});
