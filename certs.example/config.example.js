// Local test configuration — copy this file to certs/config.js and populate.
// certs/ is gitignored so your real values never get committed.
//
// The `banking` and `insurance` blocks correspond to the two sandbox LFIs
// (Model Bank altareq1 / Model Insurer altareq2). They can use the same
// client registration if your TPP is provisioned against both.

module.exports = {
  banking: {
    clientId: 'https://rp.sandbox.directory.openfinance.ae/openid_relying_party/YOUR-CLIENT-UUID',
    signingKeyId: 'YOUR-SIGNING-KID',
    redirectUri: 'https://www.google.com/',
    discoveryUri: 'https://auth1.altareq1.sandbox.apihub.openfinance.ae/.well-known/openid-configuration',
    baseUri: 'https://rs1.altareq1.sandbox.apihub.openfinance.ae',
  },
  insurance: {
    clientId: 'https://rp.sandbox.directory.openfinance.ae/openid_relying_party/YOUR-CLIENT-UUID',
    signingKeyId: 'YOUR-SIGNING-KID',
    redirectUri: 'https://www.google.com/',
    discoveryUri: 'https://auth1.altareq2.sandbox.apihub.openfinance.ae/.well-known/openid-configuration',
    baseUri: 'https://rs1.altareq2.sandbox.apihub.openfinance.ae',
  },
  // Paths are resolved relative to the repo root.
  signingKeyPath: 'certs/client_signing.key',
  transportCertPath: 'certs/client_transport.pem',
  transportKeyPath: 'certs/client_transport.key',
};
