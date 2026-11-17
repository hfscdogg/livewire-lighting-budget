'use strict';
const { mkdirSync, writeFileSync, rmSync } = require('node:fs');
require('./verify-repository').verify(__dirname);
require('./dist/pricing').validate(require('./pricing/catalog.json'));
// Only this directory is public. Company pricing and the offline HTML remain server-side.
rmSync('public', { recursive: true, force: true });
mkdirSync('public', { recursive: true });
writeFileSync('public/robots.txt', 'User-agent: *\nDisallow: /\n');
console.log('Prepared Vercel function and private shared estimator. No account or database was provisioned.');
