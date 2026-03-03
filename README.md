# Nebras Open Finance — Postman Collections

Community-maintained Postman collections for the **UAE Open Finance** sandbox (CBUAE API Hub), covering Banking and Insurance APIs.

These collections are intended to help Third Party Providers (TPPs), Licensed Financial Institutions (LFIs), and developers explore and test the UAE Open Finance ecosystem.

---

## Collections

| File | Description | Versions |
|------|-------------|----------|
| [banking-v1.2-v2.0.postman_collection.json](banking-v1.2-v2.0.postman_collection.json) | Banking APIs — Data Sharing, Payments, Confirmation of Payee, Open Products & ATMs | v1.2 and v2.0 |
| [insurance-v2.0-v2.1.postman_collection.json](insurance-v2.0-v2.1.postman_collection.json) | Insurance APIs — Policies, Claims, Premiums, Products across multiple insurance types | v2.0 and v2.1 |

---

## Banking Collection — Contents

**Top-level folders:**

- **TPP Onboarding** — Register a TPP against the API Hub sandbox
- **Postman Environment & Collection** — Fetch the Postman environment and collection from the sandbox
- **V1.2** and **V2.0** (parallel structure):
  - **Data Sharing** — Account access consents, accounts, balances, transactions, beneficiaries, standing orders, scheduled payments, party, product
  - **Service Initiation** — Domestic payments, bulk/batch payments
  - **File Payment** — File-based bulk payment submission
  - **Combined Payments — Service Initiation** — Multi-authorisation payment flows
  - **Service Initiation — International Payments** — Cross-border payment initiation
  - **Confirmation of Payee APIs** — Payee name verification (application/jwt)
  - **Payment Rail** — Payment rail enquiries
  - **Webhook** — Event subscription and delivery
  - **Data Sharing with Service Initiation** — Combined consent flows
  - **Open Product API** — Product catalogue
  - **Open ATMs API** — ATM location data (v2.0)
  - **Do Fail** — Negative test scenarios

---

## Insurance Collection — Contents

**Top-level folders:**

- **TPP Onboarding** — Register a TPP against the Insurance API Hub sandbox
- **Postman Environment & Collection** — Fetch environment and collection from sandbox
- **Insurance v2.0** and **Insurance v2.1** (parallel structure):
  - **AuthFlow** — Standard PKCE + PAR authorisation flow
  - **AuthFlow — with jwt-auth mandatory** — Authorisation flow requiring JWT authentication
  - **AuthFlow with login_hint** — Authorisation flow with login hint
  - **Insurance APIs (application/json)** — Policy, claims, premium, product and payment APIs with JSON body
  - **Insurance APIs (application/jwt)** — Same APIs with signed JWT request/response
  - **Insurance Quote LFI Patch** — Quote management endpoints
- **Health Check** / **Health Check (All services)** — Sandbox liveness checks
- **Revoke** — Token revocation
- **Webhook** — Event subscription (TPP side)
- **Do Fail** — Negative test scenarios

**Supported insurance types:** Health, Motor, Employment, Home, Life, Renters, Travel

---

## Prerequisites

1. **Postman** v10+ — [Download](https://www.postman.com/downloads/)
2. **UAE Open Finance API Hub Sandbox** access — Register at the CBUAE Developer Portal
3. A registered TPP client with:
   - A valid `client_id`
   - A signing key pair (PS256) — private key PEM and corresponding `kid`
   - A registered `redirect_uri`

---

## Getting Started

### 1. Import the collection

In Postman: **Import** → select the `.json` file(s) from this repository.

### 2. Set up your environment

The collections use Postman environment variables. Use the **Postman Environment & Collection → GET /environment** request (inside the collection) to auto-populate your environment from the sandbox, or set the variables manually:

| Variable | Description |
|----------|-------------|
| `rs` | Resource server base URL (e.g. `https://rs.sandbox...`) |
| `issuer` | Authorization server issuer URL |
| `_clientId` | Your registered TPP client ID |
| `redirectUrl` | Your registered redirect URI |
| `kid-local` | Key ID (`kid`) of your signing key |
| `pem-local` | Private key PEM string for signing JWTs |
| `basicToken` | Base64-encoded `client_id:client_secret` for Basic auth |

### 3. Run the Auth Flow

The standard flow for Data Sharing or Insurance access:

1. **TPP Onboarding → POST registration** — Register your TPP (first time only)
2. **GET OIDC well-known end-point** — Discovers and stores auth/token/PAR endpoints
3. **O3 Util: Prepare request object JWT for PAR end-point** — Builds the signed consent + authorization request
4. **O3 Util: Prepare private key JWT for PAR end-point** — Builds the private\_key\_jwt for client authentication
5. **POST to PAR end-point** — Pushes the authorization request; returns a QR code in the Postman Visualizer for the customer to scan
6. **LFI /auth** — Customer authenticates and authorizes consent (simulated in sandbox)
7. **POST token (auth-code grant)** — Exchanges the authorization code for access + refresh tokens
8. **API calls** — Use the access token against the resource endpoints

### 4. Security profile

These collections implement the **FAPI 2.0 Message Signing** profile as required by UAE Open Finance:

- **PAR** (Pushed Authorization Requests — RFC 9126)
- **PKCE** with S256 code challenge
- **Private Key JWT** client authentication (PS256)
- **Rich Authorization Requests** (`authorization_details` — RFC 9396) with consent objects
- **Signed request objects** (PS256 JWTs via the O3 utility endpoints)
- **x-fapi-interaction-id** header on all requests

---

## Permissions Reference

### Banking — Data Sharing permissions

`ReadAccountsBasic`, `ReadAccountsDetail`, `ReadBalances`, `ReadTransactionsBasic`, `ReadTransactionsDetail`, `ReadTransactionsCredits`, `ReadTransactionsDebits`, `ReadDirectDebits`, `ReadBeneficiariesBasic`, `ReadBeneficiariesDetail`, `ReadScheduledPaymentsBasic`, `ReadScheduledPaymentsDetail`, `ReadStandingOrdersBasic`, `ReadStandingOrdersDetail`, `ReadParty`, `ReadPartyUserIdentity`, `ReadProduct`

### Insurance — per insurance type

`ReadInsurancePolicies`, `ReadCustomerBasic`, `ReadCustomerDetail`, `ReadInsuranceProduct`, `ReadCustomerClaims`, `ReadInsurancePremium`, `ReadCustomerPaymentDetails`

---

## Standards & References

- [UAE Open Finance Framework](https://openfinance.ae) — CBUAE
- [FAPI 2.0 Security Profile](https://openid.net/specs/fapi-2_0-security-profile.html) — OpenID Foundation
- [RFC 9126 — Pushed Authorization Requests](https://www.rfc-editor.org/rfc/rfc9126)
- [RFC 9396 — Rich Authorization Requests](https://www.rfc-editor.org/rfc/rfc9396)
- [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636)

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## License

MIT — see [LICENSE](LICENSE).
