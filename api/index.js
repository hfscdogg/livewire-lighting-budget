'use strict';
const { createHandler, configuration } = require('../server');
const sourcePricing = require('../pricing/catalog.json');
let application;

module.exports = async function handler(req, res) {
  try {
    if (!application) application = createHandler(configuration(process.env), { sourcePricing }).catch(error => { application = null; throw error; });
    return await (await application)(req, res);
  } catch (error) {
    console.error('Estimator initialization failed:', error.code || error.name);
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify({ error: 'The estimator is not configured yet. Contact the company administrator.' }));
  }
};
