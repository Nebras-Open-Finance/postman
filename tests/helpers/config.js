const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..', '..');
const configPath = path.join(repoRoot, 'certs', 'config.js');

if (!fs.existsSync(configPath)) {
  throw new Error(
    `Missing ${path.relative(repoRoot, configPath)} — copy certs.example/config.example.js to certs/config.js and populate it.`
  );
}

const creds = require(configPath);

function resolvePath(p) {
  return path.isAbsolute(p) ? p : path.join(repoRoot, p);
}

function readFileOrThrow(p, label) {
  const abs = resolvePath(p);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing ${label} at ${path.relative(repoRoot, abs)}`);
  }
  return fs.readFileSync(abs, 'utf8');
}

const signingKeyPem = readFileOrThrow(creds.signingKeyPath, 'signing key');
const transportCert = readFileOrThrow(creds.transportCertPath, 'transport cert');
const transportKey = readFileOrThrow(creds.transportKeyPath, 'transport key');

module.exports = {
  repoRoot,
  creds,
  signingKeyPem,
  transportCert,
  transportKey,
  transportCertPath: resolvePath(creds.transportCertPath),
  transportKeyPath: resolvePath(creds.transportKeyPath),
};
