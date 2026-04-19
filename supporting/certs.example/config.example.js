// Local test configuration — copy this file to supporting/certs/config.js and populate.
// supporting/certs/ is gitignored so your real values never get committed.
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
    // Optional: pre-authorised consent artefacts, scoped by spec version and
    // API surface. Used by tests that skip the OAuth redirect-and-consent flow
    // and refresh an access token against an already-granted consent. Stage a
    // consent once via the normal PAR flow, capture the resulting refresh_token
    // and consent_id, and paste them below. The refreshToken, consentId, and
    // the consent-specific fields (permissions for data sharing; control
    // parameters and creditor for payments) are bound together — they must
    // come from the same consent.
    // preAuthorised: {
    //   v2_1: {
    //     dataSharing: {
    //       refreshToken: 'YOUR-REFRESH-TOKEN',
    //       consentId: 'YOUR-CONSENT-ID',
    //       baseConsentId: 'YOUR-BASE-CONSENT-ID',
    //       expiresAt: 'YYYY-MM-DDTHH:MM:SSZ',
    //       permissions: ['ReadAccountsBasic', /* ... */],
    //     },
    //     payments: {
    //       // Keyed by ConsentSchedule shape — each flavour binds to its own
    //       // refreshToken. Add FixedOnDemand / VariablePeriodicSchedule / etc.
    //       // as sibling entries when staging those flows.
    //       variableOnDemand: {
    //         refreshToken: 'YOUR-REFRESH-TOKEN',
    //         consentId: 'YOUR-CONSENT-ID',
    //         baseConsentId: 'YOUR-BASE-CONSENT-ID',
    //         expiresAt: 'YYYY-MM-DDTHH:MM:SSZ',
    //         // ConsentSchedule.MultiPayment.PeriodicSchedule fields — the
    //         // PeriodType governs the rolling window used for consumption
    //         // tracking (CumulativeValueOfPaymentsInCurrentPeriod).
    //         periodType: 'Week',
    //         periodStartDate: 'YYYY-MM-DD',
    //         maximumIndividualAmount: { amount: '200.00', currency: 'AED' },
    //         paymentPurposeCode: 'ACM',
    //         creditor: {
    //           agent: { schemeName: 'BICFI', identification: 'BIC-OR-ROUTING' },
    //           name: 'Creditor Name',
    //           account: {
    //             schemeName: 'AccountNumber',
    //             identification: 'CREDITOR-ACCOUNT',
    //             name: 'Creditor Name',
    //           },
    //         },
    //       },
    //     },
    //   },
    // },
  },
  insurance: {
    clientId: 'https://rp.sandbox.directory.openfinance.ae/openid_relying_party/YOUR-CLIENT-UUID',
    signingKeyId: 'YOUR-SIGNING-KID',
    redirectUri: 'https://www.google.com/',
    discoveryUri: 'https://auth1.altareq2.sandbox.apihub.openfinance.ae/.well-known/openid-configuration',
    baseUri: 'https://rs1.altareq2.sandbox.apihub.openfinance.ae',
  },
  // Paths are resolved relative to the repo root.
  signingKeyPath: 'supporting/certs/client_signing.key',
  transportCertPath: 'supporting/certs/client_transport.pem',
  transportKeyPath: 'supporting/certs/client_transport.key',
};
