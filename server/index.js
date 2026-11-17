'use strict';

const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { randomUUID } = require('node:crypto');
const { openDatabase, initialize } = require('./database');
const { transfers } = require('./transfers');
const Photos = require('../dist/job-photos');
const M = require('../dist/model');
const Pricing = require('../dist/pricing');
const Sheet = require('../dist/spreadsheet');
const { createAuth } = require('./auth');
const { InputError, scope, templates, calculate, reviewDesign, reviewPrices, estimatorReport } = require('./estimate');

const assets = new Map([
  ['/assets/keypad-sunnata.jpg', ['image/jpeg', '../dist/assets/keypad-sunnata.jpg']],
  ['/assets/keypad-palladiom.jpg', ['image/jpeg', '../dist/assets/keypad-palladiom.jpg']],
  ['/styles.css', ['text/css', '../dist/styles.css']],
  ['/job-photos.js', ['text/javascript', '../dist/job-photos.js']],
  ['/installation.js', ['text/javascript', '../dist/installation.js']],
  ['/sales-workflow.js', ['text/javascript', '../dist/sales-workflow.js']],
  ['/app.js', ['text/javascript', '../dist/app.js']],
  ['/customer-report.js', ['text/javascript', '../dist/customer-report.js']],
  ['/estimator-report.js', ['text/javascript', '../dist/estimator-report.js']],
  ['/shared.js', ['text/javascript', './shared.js']],
]);
const page = readFileSync(resolve(__dirname, 'index.html'));
const defaults = Pricing.make(M.initial(), 'preliminary-baseline', '2026-11-11');
const maxBody = 3_500_000;
const administrators = new Set(['pricing', 'owner']);
const estimateRevision = 10;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function json(res, status, value) {
  const encoded = Buffer.from(JSON.stringify(value));
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  if (encoded.length > 3000000) {
    // Vercel supports streamed responses above its buffered-response limit.
    for (let offset = 0; offset < encoded.length; offset += 65536) res.write(encoded.subarray(offset, offset + 65536));
    res.end();
  } else res.end(encoded);
}

async function body(req, origin, limit = maxBody) {
  if (req.headers.origin !== origin || req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') throw new HttpError(403, 'This request must come from the estimator.');
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new HttpError(415, 'Send JSON data.');
  if (Number(req.headers['content-length']) > limit) throw new HttpError(413, 'The file or project is too large.');
  const chunks = [];
  let length = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    length += chunk.length;
    if (length > limit) {
      req.resume();
      throw new HttpError(413, 'The file or project is too large.');
    }
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch { throw new HttpError(400, 'Invalid JSON data.'); }
}

async function currentRelease(db) {
  return await db.prepare(`SELECT * FROM releases ORDER BY ${db.releaseOrder} DESC LIMIT 1`).get();
}

function sameEstimate(a, b) {
  return JSON.stringify(Photos.withoutPhotos(a)) === JSON.stringify(Photos.withoutPhotos(b));
}

function approvalFor(row) {
  const approval = row.approval ? JSON.parse(row.approval) : null;
  return approval?.estimateRevision === estimateRevision ? approval : null;
}

function projectView(row) {
  return { id: row.id, revision: row.revision, release: row.release, updatedAt: row.updated_at, updatedBy: row.updated_by, approved: approvalFor(row) !== null, scope: scope(JSON.parse(row.scope)) };
}

function conflict() { return new HttpError(409, 'Someone else saved a newer revision. Reopen the project before replacing their changes.'); }

async function createHandler(config, { verifyGoogle, sourcePricing, database } = {}) {
  const repositoryRelease = sourcePricing ? Pricing.validate(sourcePricing) : null;
  const db = database || await openDatabase(config);
  try {
    await initialize(db);
    await db.prepare('INSERT INTO releases (version, document, published_by, published_at) VALUES (?, ?, NULL, ?) ON CONFLICT(version) DO NOTHING').run(defaults.catalogVersion, JSON.stringify(defaults), new Date().toISOString());
    if (repositoryRelease) {
      const document = JSON.stringify(repositoryRelease);
      await db.prepare('INSERT INTO releases (version, document, published_by, published_at) VALUES (?, ?, ?, ?) ON CONFLICT(version) DO NOTHING').run(repositoryRelease.catalogVersion, document, 'repository', new Date().toISOString());
      const stored = await db.prepare('SELECT document FROM releases WHERE version = ?').get(repositoryRelease.catalogVersion);
      if (JSON.stringify(Pricing.validate(JSON.parse(stored.document))) !== document) throw new Error('The repository catalog version has already been used with different pricing. Assign a new catalog version.');
    }
  } catch (error) { await db.close(); throw error; }
  const auth = await createAuth(db, config, verifyGoogle);
  const staticFiles = new Map([...assets].map(([url, [type, path]]) => [url, [type, readFileSync(resolve(__dirname, path))]]));
  const uploads = transfers(db);
  const handler = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    try {
      const url = new URL(req.url, config.origin);
      if (url.origin !== config.origin) throw new HttpError(400, 'Invalid request.');
      const path = url.pathname, method = req.method;
      if (method === 'GET' && path === '/auth/google') return await auth.start(req, res);
      if (method === 'GET' && path === '/auth/google/callback') return await auth.finish(req, res, url);
      if (method === 'GET' && path === '/') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page);
      if (method === 'GET' && staticFiles.has(path)) {
        const [type, file] = staticFiles.get(path);
        return res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }).end(file);
      }
      if (!path.startsWith('/api/')) throw new HttpError(404, 'Page not found.');
      const user = await auth.user(req);
      if (!user) throw new HttpError(401, 'Sign in with your approved Livewire Google account.');
      const canPrice = administrators.has(user.role);
      if (method === 'GET' && path === '/api/bootstrap') return json(res, 200, { ...templates(), user, currentRelease: (await currentRelease(db)).version });
      let input = method === 'POST' ? await body(req, config.origin, config.vercel ? maxBody : Photos.PROJECT_FILE_LIMIT + 10000) : null;
      if (method === 'POST' && path === '/api/uploads') return json(res, 201, await uploads.begin(user.email, input));
      const uploadMatch = path.match(/^\/api\/uploads\/([\da-f-]{36})\/(\d+)$/);
      if (method === 'POST' && uploadMatch) return json(res, 200, await uploads.part(user.email, uploadMatch[1], Number(uploadMatch[2]), input));
      if (input?.transferId) input = await uploads.consume(user.email, path, input.transferId);
      if (method === 'POST' && path === '/api/logout') { await auth.logout(req, res); return json(res, 200, {}); }
      if (method === 'GET' && path === '/api/projects') {
        const offset = Number(url.searchParams.get('offset') || 0);
        if (!Number.isSafeInteger(offset) || offset < 0) throw new HttpError(400, 'Invalid project list page.');
        const query = (url.searchParams.get('q') || '').trim().slice(0, 160);
        const rows = await db.prepare(`SELECT id, name, revision, release, updated_at AS "updatedAt", updated_by AS "updatedBy", approval
          FROM projects WHERE lower(name) LIKE ? ESCAPE '\\' ORDER BY updated_at DESC, id LIMIT 51 OFFSET ?`).all('%' + query.toLowerCase().replace(/[\\%_]/g, value => '\\' + value) + '%', offset);
        const projects = rows.slice(0, 50).map(({ approval, ...row }) => ({ ...row, approved: approvalFor({ approval }) !== null }));
        return json(res, 200, { projects, next: rows.length > 50 ? offset + 50 : null });
      }
      if (method === 'POST' && path === '/api/projects') {
        const clean = scope(input.scope);
        const id = randomUUID();
        const row = await db.prepare(`INSERT INTO projects (id, name, scope, release, revision, approval, updated_by, updated_at) SELECT ?, ?, ?, version, 1, NULL, ?, ? FROM releases ORDER BY ${db.releaseOrder} DESC LIMIT 1 RETURNING *`).get(id, clean.project.name, JSON.stringify(clean), user.email, new Date().toISOString());
        return json(res, 201, projectView(row));
      }
      if (method === 'POST' && path === '/api/import') return json(res, 200, { scope: scope(input.scope, { legacy: true }) });
      if (path === '/api/pricing' && (method === 'GET' || method === 'POST')) {
        if (method === 'POST' && !canPrice) throw new HttpError(403, 'Pricing administrator access required.');
        if (method === 'GET') {
          const release = await currentRelease(db);
          const document = Pricing.validate(JSON.parse(release.document));
          if (url.searchParams.get('format') === 'csv') {
            const state = Pricing.apply(M.initial(), document);
            return res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="Livewire-Price-List.csv"' }).end(Sheet.csv(Sheet.rows(state)));
          }
          return json(res, 200, { release: document, publishedAt: release.published_at, publishedBy: release.published_by });
        }
        if (input.validated !== true) throw new InputError('Confirm that supplier costs, equipment and labor standards were checked.');
        let release;
        try {
          release = input.format === 'csv'
            ? Sheet.importCSV(input.file, Pricing.apply(M.initial(), JSON.parse((await currentRelease(db)).document)))
            : Pricing.validate(input.file);
        } catch (error) { throw new InputError(error.message); }
        if (release.settings.currentRate !== 112.5 || release.settings.travelBasis !== 'crew') throw new InputError('Use $112.50 per person-hour and crew-based travel.');
        if (release.effectiveAt > M.initial().project.date) throw new InputError('Use today or an earlier effective date.');
        const inserted = await db.prepare('INSERT INTO releases (version, document, published_by, published_at) VALUES (?, ?, ?, ?) ON CONFLICT(version) DO NOTHING').run(release.catalogVersion, JSON.stringify(release), user.email, new Date().toISOString());
        if (!inserted.changes) throw new HttpError(409, 'That price-list version already exists.');
        return json(res, 201, { version: release.catalogVersion });
      }
      const match = path.match(/^\/api\/projects\/([\da-f-]{36})(?:\/(review|reprice))?$/);
      const id = match?.[1];
      const row = id ? await db.prepare('SELECT * FROM projects WHERE id = ?').get(id) : null;
      if (id && !row) throw new HttpError(404, 'Project not found.');
      if (method === 'GET' && row && !match[2]) return json(res, 200, projectView(row));
      if (method === 'POST' && row && !match[2]) {
        const clean = scope(input.scope);
        const encoded = JSON.stringify(clean);
        const unchanged = sameEstimate(scope(JSON.parse(row.scope)), clean);
        const changed = await db.prepare(`UPDATE projects SET name = ?, scope = ?, approval = CASE WHEN ? = 1 THEN approval ELSE NULL END,
          revision = revision + 1, updated_by = ?, updated_at = ? WHERE id = ? AND revision = ? RETURNING *`)
          .get(clean.project.name, encoded, Number(unchanged), user.email, new Date().toISOString(), id, input.revision ?? -1);
        if (!changed) throw conflict();
        return json(res, 200, projectView(changed));
      }
      if (method === 'POST' && ['/api/estimate','/api/estimator-report'].includes(path)) {
        const clean = scope(input.scope);
        const saved = input.id ? await db.prepare('SELECT * FROM projects WHERE id = ?').get(input.id) : null;
        if (input.id && !saved) throw new HttpError(404, 'Project not found.');
        const release = saved ? await db.prepare('SELECT * FROM releases WHERE version = ?').get(saved.release) : await currentRelease(db);
        const approved = saved && sameEstimate(scope(JSON.parse(saved.scope)), clean) ? approvalFor(saved) : null;
        if (path === '/api/estimator-report') return json(res, 200, estimatorReport(clean, JSON.parse(release.document), approved));
        const { summary, report, labor, routes, requirements } = calculate(clean, JSON.parse(release.document), approved);
        return json(res, 200, { summary, labor, routes, requirements, report: approved?.report || report, release: release.version });
      }
      if (method === 'POST' && row && match[2]) {
        if (!canPrice) throw new HttpError(403, 'Pricing administrator access required.');
        if (row.revision !== input.revision) throw conflict();
        const timestamp = new Date().toISOString();
        if (match[2] === 'reprice') {
          const release = await currentRelease(db);
          if (release.version === row.release) return json(res, 200, projectView(row));
          const changed = await db.prepare('UPDATE projects SET release = ?, approval = NULL, revision = revision + 1, updated_by = ?, updated_at = ? WHERE id = ? AND revision = ? RETURNING *').get(release.version, user.email, timestamp, id, row.revision);
          if (!changed) throw conflict();
          return json(res, 200, projectView(changed));
        }
        if (input.reviewed !== true) throw new InputError('Confirm the project scope and design review.');
        const release = await db.prepare('SELECT * FROM releases WHERE version = ?').get(row.release);
        if (!release.published_by) throw new InputError('Move this project to a reviewed company price list first.');
        const clean = scope(JSON.parse(row.scope));
        const pricing = Pricing.validate(JSON.parse(release.document));
        const design = { ...reviewDesign(clean, input.design), ...reviewPrices(clean, input, pricing.settings.shippingHandling && pricing.settings.shadeBudgetBasis !== 'historical-high') };
        const result = calculate(clean, pricing, null, true, design);
        if (result.summary.shadeCount && input.shadeAllowanceReviewed !== true && input.shadeQuotes !== true) throw new InputError('Confirm the selected shade allowance or quote, assembly inclusions, power and mounting.');
        if (!result.report.range) return json(res, 422, { error: 'The project still has unresolved scope or pricing.', issues: result.issues });
        const approval = JSON.stringify({ estimateRevision, report: result.report, design, by: user.email, at: timestamp });
        const changed = await db.prepare('UPDATE projects SET approval = ?, revision = revision + 1, updated_by = ?, updated_at = ? WHERE id = ? AND revision = ? RETURNING *').get(approval, user.email, timestamp, id, row.revision);
        if (!changed) throw conflict();
        return json(res, 200, projectView(changed));
      }
      throw new HttpError(404, 'Page not found.');
    } catch (error) {
      if (!(error.status || error instanceof InputError)) console.error('Estimator request failed:', error.code || error.name);
      if (!res.headersSent) json(res, error.status || (error instanceof InputError ? 422 : 500), { error: error.status || error instanceof InputError ? error.message : 'The estimator could not complete this request.' });
    }
  };
  handler.close = () => db.close();
  return handler;
}

async function createApp(config, options) {
  const handler = await createHandler(config, options);
  const server = createServer({ requestTimeout: 30000, headersTimeout: 15000 }, handler);
  server.on('close', () => { Promise.resolve(handler.close()).catch(error => console.error('Database close failed:', error.code || error.name)); });
  return server;
}

function configuration(env) {
  const vercel = env.VERCEL === '1';
  if (vercel && (!env.LIVEWIRE_ORIGIN || !env.DATABASE_URL)) throw Error('Set LIVEWIRE_ORIGIN and a durable PostgreSQL DATABASE_URL for Vercel.');
  const origin = new URL(env.LIVEWIRE_ORIGIN || 'http://127.0.0.1:8787');
  if (vercel && origin.protocol !== 'https:') throw Error('Vercel requires an HTTPS LIVEWIRE_ORIGIN.');
  if (env.DATABASE_URL && !/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL)) throw Error('DATABASE_URL must be a PostgreSQL connection string.');
  if (origin.href !== `${origin.origin}/` || !(origin.protocol === 'https:' || origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) throw new Error('LIVEWIRE_ORIGIN must be an HTTPS origin or an HTTP loopback origin.');
  const domain = (env.LIVEWIRE_GOOGLE_DOMAIN || '').trim().toLowerCase();
  const entries = JSON.parse(env.LIVEWIRE_MEMBERS || '{}');
  const members = new Map(Object.entries(entries).map(([email, role]) => [email.trim().toLowerCase(), role]));
  if (!domain || !env.LIVEWIRE_GOOGLE_CLIENT_ID || !env.LIVEWIRE_GOOGLE_CLIENT_SECRET || ![...members.values()].includes('owner')) throw new Error('Configure Google sign-in, the work domain and at least one owner.');
  if ([...members].some(([email, role]) => email.split('@').length !== 2 || !email.endsWith(`@${domain}`) || !['sales', 'pricing', 'owner'].includes(role))) throw new Error('Each approved member needs a work email and a recognized role.');
  return { vercel, databaseUrl: env.DATABASE_URL || null, origin: origin.origin, domain, members, clientId: env.LIVEWIRE_GOOGLE_CLIENT_ID, clientSecret: env.LIVEWIRE_GOOGLE_CLIENT_SECRET, dbPath: resolve(env.LIVEWIRE_DB_PATH || 'data/estimator.sqlite') };
}

if (require.main === module) {
  try {
    process.umask(0o077);
    const config = configuration(process.env);
    const port = Number(process.env.LIVEWIRE_PORT || 8787);
    const sourcePricing = JSON.parse(readFileSync(resolve(__dirname, '../pricing/catalog.json'), 'utf8'));
    createApp(config, { sourcePricing }).then(app => app.listen(port, '127.0.0.1', () => console.log(`Livewire estimator listening on 127.0.0.1:${port}`))).catch(error => { console.error('Estimator initialization failed:', error.code || error.name); process.exitCode = 1; });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { createApp, createHandler, configuration };
