'use strict';
const { randomUUID } = require('node:crypto');
const Photos = require('../dist/job-photos');
const CHUNK_CHARS = 500000;
const MAX_BYTES = Photos.PROJECT_FILE_LIMIT + 10000;
const targetPattern = /^\/api\/(?:import|estimate|estimator-report|projects(?:\/[\da-f-]{36})?)$/;
const now = () => Math.floor(Date.now() / 1000);
const failure = (status, message) => Object.assign(new Error(message), { status });

function transfers(db) {
  return {
    async begin(owner, input) {
      if (!targetPattern.test(input.target) || !Number.isInteger(input.parts) || input.parts < 1 || input.parts > 32 || !Number.isInteger(input.bytes) || input.bytes < 1 || input.bytes > MAX_BYTES) throw failure(422, 'Invalid project upload.');
      await db.prepare('DELETE FROM uploads WHERE expires <= ?').run(now());
      const { count } = await db.prepare('SELECT COUNT(*) AS count FROM uploads WHERE owner = ?').get(owner);
      if (Number(count) >= 10) throw failure(429, 'Too many unfinished uploads. Wait 15 minutes before trying again.');
      const id = randomUUID();
      await db.prepare('INSERT INTO uploads (id, owner, target, parts, bytes, expires) VALUES (?, ?, ?, ?, ?, ?)').run(id, owner, input.target, input.parts, input.bytes, now() + 900);
      return { id };
    },
    async part(owner, id, part, input) {
      if (!Number.isInteger(part) || part < 0 || typeof input.text !== 'string' || input.text.length > CHUNK_CHARS) throw failure(422, 'Invalid upload section.');
      const result = await db.prepare(`INSERT INTO upload_parts (upload_id, part, content)
        SELECT id, ?, ? FROM uploads WHERE id = ? AND owner = ? AND expires > ? AND consumed = 0 AND parts > ?
        ON CONFLICT(upload_id, part) DO UPDATE SET content = excluded.content`).run(part, input.text, id, owner, now(), part);
      if (!result.changes) throw failure(404, 'Upload expired or unavailable. Save the project again.');
      return {};
    },
    async consume(owner, target, id) {
      const upload = await db.prepare('UPDATE uploads SET consumed = 1 WHERE id = ? AND owner = ? AND target = ? AND expires > ? AND consumed = 0 RETURNING *').get(id, owner, target, now());
      if (!upload) throw failure(404, 'Upload expired or unavailable. Save the project again.');
      try {
        const rows = await db.prepare('SELECT part, content FROM upload_parts WHERE upload_id = ? ORDER BY part').all(id);
        if (rows.length !== upload.parts || rows.some((row, index) => row.part !== index)) throw failure(422, 'The upload is incomplete. Save the project again.');
        const text = rows.map(row => row.content).join('');
        if (Buffer.byteLength(text) !== upload.bytes || Buffer.byteLength(text) > MAX_BYTES) throw failure(413, 'The project upload has an invalid size.');
        let value;
        try { value = JSON.parse(text); } catch { throw failure(400, 'Invalid project upload.'); }
        if (!value || typeof value !== 'object' || Array.isArray(value) || value.transferId) throw failure(400, 'Invalid project upload.');
        return value;
      } finally {
        await db.prepare('DELETE FROM uploads WHERE id = ? AND owner = ?').run(id, owner);
      }
    },
  };
}
module.exports = { transfers, CHUNK_CHARS, MAX_BYTES };
