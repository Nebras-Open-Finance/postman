const https = require('node:https');
const { URL } = require('node:url');
const { transportCert, transportKey } = require('./config');

const cache = new Map();

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      method: 'GET',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      cert: transportCert,
      key: transportKey,
      rejectUnauthorized: process.env.NEBRAS_TLS_STRICT === '1',
      headers: { Accept: 'application/json' },
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`GET ${url} -> ${res.statusCode}: ${body.slice(0, 200)}`));
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`Invalid JSON from ${url}: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function discover(discoveryUri) {
  if (cache.has(discoveryUri)) return cache.get(discoveryUri);
  const doc = await fetchJson(discoveryUri);
  cache.set(discoveryUri, doc);
  return doc;
}

module.exports = { discover };
