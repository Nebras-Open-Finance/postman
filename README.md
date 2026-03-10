# UAE Open Finance – Postman Collection

A Postman collection provided to the UAE Open Finance ecosystem to help **LFIs** (Licensed Financial Institutions) and **TPPs** (Third-Party Providers) test their API implementations against the Open Finance Trust Framework.

---

## Prerequisites

Before using this collection you must have:

- A registered application on the **Sandbox** or **Production** Trust Framework.
- Your application provisioned with a **Client Transport** certificate and a **Client Signing** key.

You will need the following credentials and files:

| Item | Description |
|---|---|
| `ClientId` | The client ID of your registered application |
| `RedirectURI` | The redirect URI registered against your application |
| `Transport Certificate` | Client transport certificate (`.pem`) — used to configure mTLS in Postman |
| `Transport Key` | Private key for the transport certificate (`.key`) |
| `Signing Key ID` | The `kid` of your client signing key |
| `Signing Key` | Private key for signing (`.key`) |

---

## Endpoints

### Model Bank (Sandbox)

| | URL |
|---|---|
| Discovery | `https://auth1.altareq1.sandbox.apihub.openfinance.ae/.well-known/openid-configuration` |
| Base URI | `https://rs1.altareq1.sandbox.apihub.openfinance.ae` |

### Model Insurer (Sandbox)

| | URL |
|---|---|
| Discovery | `https://auth1.altareq2.sandbox.apihub.openfinance.ae/.well-known/openid-configuration` |
| Base URI | `https://rs1.altareq2.sandbox.apihub.openfinance.ae` |

### LFI Pre-Production

Replace `[LFI CODE]` with the LFI's assigned code:

| | URL |
|---|---|
| Discovery | `https://auth1.[LFI CODE].preprod.apihub.openfinance.ae/.well-known/openid-configuration` |
| Base URI | `https://rs1.[LFI CODE].preprod.apihub.openfinance.ae` |

---

## Setting Up Postman

### 1. Install Postman

1. Download Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/).
2. Launch Postman and sign in (or create a free account).

### 2. Import the Collection

1. In Postman, click **Import** (top left).
2. Select the collection `.json` file from this repository.
3. The collection will appear in your **Collections** sidebar.

### 3. Configure mTLS Certificates

mTLS is required for all calls to the Trust Framework endpoints. Configure your client transport certificate as follows:

1. Open **Settings** by clicking the gear icon (top right).
2. Navigate to the **Certificates** tab.
3. Click **Add Certificate** and fill in the fields:

   | Field | Value |
   |---|---|
   | **Host** | The domain of the LFI you are testing against (see examples below — no protocol prefix) |
   | **Port** | Leave blank (defaults to `443`) |
   | **CRT file** | Browse to your Transport Certificate (`.pem`) |
   | **KEY file** | Browse to your Transport Key (`.key`) |

   **Host examples:**

   | Environment | Host pattern |
   |---|---|
   | Model Bank (Sandbox) | `*.altareq1.sandbox.apihub.openfinance.ae` |
   | Model Insurer (Sandbox) | `*.altareq2.sandbox.apihub.openfinance.ae` |
   | LFI Pre-Production | `*.[LFI CODE].preprod.apihub.openfinance.ae` |

4. Click **Add** to save the certificate entry.

> **Note:** If you are testing against multiple LFIs, you will need a separate certificate entry for each host pattern.

### 4. Verify Your Setup — TPP Registration

Send a request to the **TPP Registration** endpoint in the collection.

A `201 Created` or `200 OK` response confirms mTLS and your credentials are configured correctly.

> If you receive a `400` or an SSL handshake error, double-check that the host pattern in your certificate entry matches the LFI's domain exactly.

---

## Collection Variables

Set the following variables in the collection or environment before running requests:

| Variable | Description |
|---|---|
| `clientId` | Your application's client ID |
| `redirectUri` | Your application's registered redirect URI |
| `signingKeyId` | The `kid` of your client signing key |
| `signingKey` | Contents of your signing private key (`.key`) |
| `discoveryUri` | Discovery endpoint for the target LFI |
| `baseUri` | Base resource server URI for the target LFI |

---

## Support

For issues with the Trust Framework or onboarding, contact the UAE Open Finance team through the official portal.
