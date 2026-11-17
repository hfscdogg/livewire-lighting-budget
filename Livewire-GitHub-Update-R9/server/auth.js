'use strict';

const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const { OAuth2Client } = require('google-auth-library');

const random = () => randomBytes(32).toString('base64url');
const digest = value => createHash('sha256').update(value).digest('base64url');
const sessionSeconds = 8 * 60 * 60;
const flowSeconds = 10 * 60;

function cookieValue(req, name) {
  const match = String(req.headers.cookie || '').split(';').find(part => part.trimStart().startsWith(`${name}=`));
  return match?.trim().slice(name.length + 1) ?? '';
}

function equal(a, b) {
  return typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function createAuth(db, config, verifyGoogle = null) {
  const { origin, clientId, clientSecret, domain, members } = config;
  const secure = origin.startsWith('https:');
  const sessionName = secure ? '__Host-livewire-session' : 'livewire-dev-session';
  const flowName = secure ? '__Host-livewire-login' : 'livewire-dev-login';
  const callback = `${origin}/auth/google/callback`;
  const client = new OAuth2Client(clientId);
  const now = () => Math.floor(Date.now() / 1000);
  const setCookie = (name, value, seconds) => `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${secure ? '; Secure' : ''}`;

  async function googleClaims(code, verifier) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callback, code_verifier: verifier, grant_type: 'authorization_code' }),
    });
    if (!response.ok) throw new Error('Google token exchange failed.');
    const tokens = await response.json();
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    return ticket.getPayload();
  }

  async function start(req, res) {
    const id = random(), state = random(), nonce = random(), verifier = random();
    await db.prepare('DELETE FROM login_flows WHERE expires <= ? OR id = ?').run(now(), digest(cookieValue(req, flowName)));
    await db.prepare('INSERT INTO login_flows VALUES (?, ?, ?, ?, ?)').run(digest(id), state, nonce, verifier, now() + flowSeconds);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({ client_id: clientId, redirect_uri: callback, response_type: 'code', scope: 'openid email', state, nonce, hd: domain, code_challenge_method: 'S256', code_challenge: digest(verifier), prompt: 'select_account' });
    res.writeHead(303, { Location: url.href, 'Set-Cookie': setCookie(flowName, id, flowSeconds) }).end();
  }

  async function finish(req, res, url) {
    const id = digest(cookieValue(req, flowName));
    const flow = await db.prepare('DELETE FROM login_flows WHERE id = ? RETURNING state, nonce, verifier, expires').get(id);
    const clear = setCookie(flowName, '', 0);
    try {
      if (!flow || flow.expires <= now() || !equal(flow.state, url.searchParams.get('state')) || !url.searchParams.get('code')) throw new Error('Invalid login flow.');
      const claims = await (verifyGoogle || googleClaims)(url.searchParams.get('code'), flow.verifier, flow.nonce);
      const email = String(claims.email || '').toLowerCase();
      if (!equal(claims.nonce, flow.nonce) || claims.hd !== domain || claims.email_verified !== true || !members.has(email) || typeof claims.sub !== 'string' || !claims.sub) throw new Error('Account is not approved.');
      await db.prepare('INSERT INTO identities VALUES (?, ?) ON CONFLICT(email) DO NOTHING').run(email, claims.sub);
      const bound = await db.prepare('SELECT subject FROM identities WHERE email = ?').get(email);
      if (bound.subject !== claims.sub) throw new Error('Google account does not match its enrolled identity.');
      const token = random();
      await db.prepare('DELETE FROM sessions WHERE expires <= ? OR id = ?').run(now(), digest(cookieValue(req, sessionName)));
      await db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(token), email, now() + sessionSeconds);
      res.writeHead(303, { Location: '/', 'Set-Cookie': [clear, setCookie(sessionName, token, sessionSeconds)] }).end();
    } catch {
      res.writeHead(303, { Location: '/?signin=denied', 'Set-Cookie': clear }).end();
    }
  }

  async function user(req) {
    const token = cookieValue(req, sessionName);
    if (!token) return null;
    const row = await db.prepare('SELECT email FROM sessions WHERE id = ? AND expires > ?').get(digest(token), now());
    const role = row && members.get(row.email);
    return role ? { email: row.email, role } : null;
  }

  async function logout(req, res) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').run(digest(cookieValue(req, sessionName)));
    res.setHeader('Set-Cookie', setCookie(sessionName, '', 0));
  }

  return { start, finish, user, logout };
}

module.exports = { createAuth };
