import fs from 'node:fs';
import path from 'node:path';

const COLLECTION = path.resolve('insurance.postman_collection.json');
const raw = fs.readFileSync(COLLECTION, 'utf8');
const doc = JSON.parse(raw);

const v21 = doc.item.find(x => x.name === 'Insurance v2.1');
const quot = v21.item.find(x => x.name === 'Quotation');
const motor = quot.item.find(x => x.name === 'Motor Insurance');

const TYPES = [
  {
    name: 'Health',
    lower: 'health',
    subType: 'Comprehensive Family Plan',
    kycDocs: [
      { Type: 'EmiratesID',         FileName: 'ahmed_emirates_id.pdf',        Hash: 'a3b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef123456' },
      { Type: 'PassportCopy',       FileName: 'ahmed_passport.pdf',           Hash: 'b4c3d2e1f6789012345678901234567890abcdef1234567890abcdef234567' },
      { Type: 'MedicalDeclaration', FileName: 'ahmed_medical_declaration.pdf', Hash: 'c5d4e3f2a1b0987654321098765432109876fedcba0987654321fedcba345678' },
    ],
    createBodyBuilder: buildHealthCreateBody,
  },
  {
    name: 'Employment',
    lower: 'employment',
    subType: 'Employee Loss of Income',
    kycDocs: [
      { Type: 'EmiratesID',        FileName: 'ahmed_emirates_id.pdf',        Hash: 'a3b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef123456' },
      { Type: 'PassportCopy',      FileName: 'ahmed_passport.pdf',           Hash: 'b4c3d2e1f6789012345678901234567890abcdef1234567890abcdef234567' },
      { Type: 'EmploymentContract', FileName: 'ahmed_employment_contract.pdf', Hash: 'c5d4e3f2a1b0987654321098765432109876fedcba0987654321fedcba345678' },
    ],
    createBodyBuilder: buildEmploymentCreateBody,
  },
  {
    name: 'Home',
    lower: 'home',
    subType: 'Home Buildings and Contents',
    kycDocs: [
      { Type: 'EmiratesID',   FileName: 'ahmed_emirates_id.pdf',  Hash: 'a3b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef123456' },
      { Type: 'PassportCopy', FileName: 'ahmed_passport.pdf',     Hash: 'b4c3d2e1f6789012345678901234567890abcdef1234567890abcdef234567' },
      { Type: 'TitleDeed',    FileName: 'ahmed_title_deed.pdf',   Hash: 'c5d4e3f2a1b0987654321098765432109876fedcba0987654321fedcba345678' },
    ],
    createBodyBuilder: buildHomeCreateBody,
  },
  {
    name: 'Life',
    lower: 'life',
    subType: 'Term Life Cover',
    kycDocs: [
      { Type: 'EmiratesID',         FileName: 'ahmed_emirates_id.pdf',         Hash: 'a3b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef123456' },
      { Type: 'PassportCopy',       FileName: 'ahmed_passport.pdf',            Hash: 'b4c3d2e1f6789012345678901234567890abcdef1234567890abcdef234567' },
      { Type: 'MedicalDeclaration', FileName: 'ahmed_medical_declaration.pdf', Hash: 'c5d4e3f2a1b0987654321098765432109876fedcba0987654321fedcba345678' },
    ],
    createBodyBuilder: buildLifeCreateBody,
  },
  {
    name: 'Renters',
    lower: 'renters',
    subType: 'Renters Contents Cover',
    kycDocs: [
      { Type: 'EmiratesID',     FileName: 'ahmed_emirates_id.pdf',     Hash: 'a3b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef123456' },
      { Type: 'PassportCopy',   FileName: 'ahmed_passport.pdf',        Hash: 'b4c3d2e1f6789012345678901234567890abcdef1234567890abcdef234567' },
      { Type: 'LeaseAgreement', FileName: 'ahmed_tenancy_contract.pdf', Hash: 'c5d4e3f2a1b0987654321098765432109876fedcba0987654321fedcba345678' },
    ],
    createBodyBuilder: buildRentersCreateBody,
  },
  {
    name: 'Travel',
    lower: 'travel',
    subType: 'Single Trip Comprehensive',
    kycDocs: [
      { Type: 'EmiratesID',      FileName: 'ahmed_emirates_id.pdf',   Hash: 'a3b2c1d4e5f6789012345678901234567890abcdef1234567890abcdef123456' },
      { Type: 'PassportCopy',    FileName: 'ahmed_passport.pdf',      Hash: 'b4c3d2e1f6789012345678901234567890abcdef1234567890abcdef234567' },
      { Type: 'TravelItinerary', FileName: 'ahmed_trip_itinerary.pdf', Hash: 'c5d4e3f2a1b0987654321098765432109876fedcba0987654321fedcba345678' },
    ],
    createBodyBuilder: buildTravelCreateBody,
  },
];

function scenarioFromSubfolder(name) {
  if (name.includes('Renewal')) return 'Renewal';
  if (name.includes('Switch')) return 'Switch';
  return 'New';
}

function scenarioRefs(scenario, typeLower) {
  const t = typeLower.toUpperCase().slice(0, 3);
  if (scenario === 'Renewal') {
    return { QuoteReference: `QTE-${t}-2025-020`, CustomerId: `POL-${t}-2024-987654` };
  }
  if (scenario === 'Switch') {
    return { QuoteReference: `QTE-${t}-BROKERB-2026-001`, CustomerId: `POL-${t}-2024-987654` };
  }
  return { QuoteReference: `QTE-${t}-2024-001`, CustomerId: `CUST-${t}-2024-001` };
}

function policyIssuance(tppLed) {
  return tppLed
    ? { CustomerVerification: true, Payment: true, PolicyDocuments: true }
    : { CustomerVerification: false, Payment: false, PolicyDocuments: false };
}

function policyDates() {
  return { PolicyStartDate: '2026-05-01', PolicyEndDate: '2027-04-30' };
}

function policyHolderBase() {
  return {
    Salutation: 'Mr',
    FirstName: 'Ahmed',
    LastName: 'Al Marri',
    Gender: 'Male',
    DateOfBirth: '1993-07-12',
    MaritalStatus: 'Married',
    Nationality: 'ARE',
    MobileNumber: '+971501234567',
    EmailAddress: 'ahmed.almarri@example.ae',
    Address: [
      {
        AddressType: 'Residential',
        StreetName: 'Sheikh Zayed Road',
        BuildingNumber: '1234',
        TownName: 'Dubai',
        CountrySubDivision: 'Dubai',
        Country: 'ARE',
        PostCode: '12345',
      },
    ],
    Identity: {
      EmiratesID: '784-1993-1234567-1',
      Passport: { Number: 'N1234567', Country: 'ARE' },
    },
  };
}

function buildHealthCreateBody(scenario, tppLed) {
  const refs = scenarioRefs(scenario, 'health');
  return {
    Data: {
      ...refs,
      QuoteType: scenario,
      PolicyIssuanceRequest: policyIssuance(tppLed),
      Policy: {
        Takaful: true,
        CoverSubjects: 'SelfAndFamily',
        ...policyDates(),
        IsPolicyholderInsured: true,
        AddOns: { DentalCover: true, OpticalCover: true, MaternityCover: false },
      },
      PolicyHolder: policyHolderBase(),
    },
  };
}

function buildEmploymentCreateBody(scenario, tppLed) {
  const refs = scenarioRefs(scenario, 'employment');
  return {
    Data: {
      ...refs,
      QuoteType: scenario,
      PolicyIssuanceRequest: policyIssuance(tppLed),
      Policy: {
        Takaful: false,
        ...policyDates(),
        BenefitPeriod: 'P6M',
        WaitingPeriod: 'P30D',
        MonthlyBenefitAmount: { Amount: '15000.00', Currency: 'AED' },
      },
      PolicyHolder: policyHolderBase(),
      Employment: {
        EmployerName: 'Emirates Holdings LLC',
        JobTitle: 'Senior Engineer',
        EmploymentType: 'FullTime',
        StartDate: '2020-03-01',
        MonthlyGrossSalary: { Amount: '25000.00', Currency: 'AED' },
        VisaType: 'EmploymentVisa',
      },
    },
  };
}

function buildHomeCreateBody(scenario, tppLed) {
  const refs = scenarioRefs(scenario, 'home');
  return {
    Data: {
      ...refs,
      QuoteType: scenario,
      PolicyIssuanceRequest: policyIssuance(tppLed),
      Policy: {
        Takaful: false,
        ...policyDates(),
        CoverType: 'BuildingsAndContents',
        BuildingsCover: { SumInsured: { Amount: '1500000.00', Currency: 'AED' } },
        ContentsCover: { SumInsured: { Amount: '250000.00', Currency: 'AED' } },
      },
      PolicyHolder: policyHolderBase(),
      PropertyDetails: {
        AddressType: 'Residential',
        StreetName: 'Al Safa 2',
        BuildingNumber: '42',
        TownName: 'Dubai',
        CountrySubDivision: 'Dubai',
        Country: 'ARE',
        PostCode: '54321',
        PropertyType: 'Villa',
        NumberOfBedrooms: 4,
        YearBuilt: '2015',
        OccupancyStatus: 'OwnerOccupied',
      },
    },
  };
}

function buildLifeCreateBody(scenario, tppLed) {
  const refs = scenarioRefs(scenario, 'life');
  return {
    Data: {
      ...refs,
      QuoteType: scenario,
      PolicyIssuanceRequest: policyIssuance(tppLed),
      Policy: {
        Takaful: false,
        ...policyDates(),
        PolicyTerm: 'P10Y',
        SumAssured: { Amount: '1000000.00', Currency: 'AED' },
        CoverType: 'Term',
      },
      PolicyHolder: policyHolderBase(),
      InsuredParties: [
        {
          Salutation: 'Mr',
          FirstName: 'Ahmed',
          LastName: 'Al Marri',
          Gender: 'Male',
          DateOfBirth: '1993-07-12',
          Nationality: 'ARE',
          Relationship: 'Self',
          SmokerStatus: 'NonSmoker',
        },
      ],
    },
  };
}

function buildRentersCreateBody(scenario, tppLed) {
  const refs = scenarioRefs(scenario, 'renters');
  return {
    Data: {
      ...refs,
      QuoteType: scenario,
      PolicyIssuanceRequest: policyIssuance(tppLed),
      Policy: {
        Takaful: false,
        ...policyDates(),
        ContentsSumInsured: { Amount: '150000.00', Currency: 'AED' },
        PersonalLiabilityCover: { Amount: '500000.00', Currency: 'AED' },
      },
      PolicyHolder: policyHolderBase(),
      Lease: {
        LeaseStartDate: '2025-08-01',
        LeaseEndDate: '2026-07-31',
        MonthlyRentAmount: { Amount: '8500.00', Currency: 'AED' },
        PropertyAddress: {
          AddressType: 'Residential',
          StreetName: 'Al Wasl Road',
          BuildingNumber: '88',
          TownName: 'Dubai',
          CountrySubDivision: 'Dubai',
          Country: 'ARE',
          PostCode: '23456',
        },
        PropertyType: 'Apartment',
        NumberOfBedrooms: 2,
      },
    },
  };
}

function buildTravelCreateBody(scenario, tppLed) {
  const refs = scenarioRefs(scenario, 'travel');
  return {
    Data: {
      ...refs,
      QuoteType: scenario,
      PolicyIssuanceRequest: policyIssuance(tppLed),
      Policy: {
        Takaful: false,
        TripType: 'SingleTrip',
        TripStartDate: '2026-06-10',
        TripEndDate: '2026-06-24',
        DestinationCountries: ['GBR', 'FRA'],
        CoverLevel: 'Comprehensive',
        OptionalCoverAddOns: {
          BaggageCover: true,
          TripCancellationCover: true,
          HighRiskActivityCover: false,
        },
      },
      PolicyHolder: policyHolderBase(),
      InsuredTravellers: [
        {
          FirstName: 'Ahmed',
          LastName: 'Al Marri',
          DateOfBirth: '1993-07-12',
          Gender: 'Male',
          Nationality: 'ARE',
          Relationship: 'Self',
        },
      ],
    },
  };
}

function buildAcceptQuoteScript(type, { tppLed, withWebhook }) {
  const dataBlock = {
    QuoteReference: "__VAR_QR__",
    QuoteStatus: 'ApplicationPending',
    QuoteCreationDateTime: '2025-11-17T11:45:52.216158Z',
    InsuranceSubType: type.subType,
    ...(tppLed ? { PolicyIssuanceRequest: { CustomerVerification: true, Payment: false, PolicyDocuments: true } } : {}),
    Premium: {
      PaymentFrequency: 'OneTime',
      PremiumAmountExcludingVAT: { Amount: '2857.14', Currency: 'AED' },
      VATAmount: { Amount: '142.86', Currency: 'AED' },
      TotalPremiumAmount: { Amount: '3000.00', Currency: 'AED' },
    },
    Commission: { PaymentMethod: 'ThroughAPIHub' },
  };
  const message = { Data: dataBlock };
  if (withWebhook) {
    message.Subscription = {
      Webhook: {
        Url: `https://tpp.example.com/webhooks/${type.lower}-quote`,
        IsActive: true,
      },
    };
  }
  let dataJson = JSON.stringify({
    aud: ['__VAR_ISS__'],
    iss: '__VAR_CID__',
    iat: '__VAR_NOW__',
    exp: '__VAR_EXP__',
    nbf: 0,
    message,
  }, null, 4);
  dataJson = dataJson
    .replace('"__VAR_ISS__"', 'pm.environment.get("issuer")')
    .replace('"__VAR_CID__"', 'pm.environment.get("_clientId")')
    .replace('"__VAR_NOW__"', 'now')
    .replace('"__VAR_EXP__"', 'now + 300')
    .replace('"__VAR_QR__"', "(pm.environment.name ? pm.environment : pm.collectionVariables).get('QuoteReference')");
  return [
    "const uuid = require('uuid');",
    'pm.environment.set("interactionId", uuid.v4());',
    'const now = Math.floor(Date.now() / 1000);',
    `const data1 = JSON.stringify(${dataJson});`,
    'pm.environment.set("data", data1);',
  ];
}

function buildSubmitKycScript(type) {
  const dataBlock = {
    QuoteReference: "__VAR_QR__",
    QuoteStatus: 'KYCCaptured',
    QuoteCreationDateTime: '2025-11-17T11:45:52.216158Z',
    InsuranceSubType: type.subType,
    PolicyIssuanceRequest: { CustomerVerification: true, Payment: false, PolicyDocuments: true },
    Premium: {
      PaymentFrequency: 'OneTime',
      PremiumAmountExcludingVAT: { Amount: '2857.14', Currency: 'AED' },
      VATAmount: { Amount: '142.86', Currency: 'AED' },
      TotalPremiumAmount: { Amount: '3000.00', Currency: 'AED' },
    },
    Commission: { PaymentMethod: 'ThroughAPIHub' },
    Documents: type.kycDocs.map(d => ({
      Type: d.Type,
      FileName: d.FileName,
      ContentType: 'application/pdf',
      Content: 'JVBERi0xLjQKJcTl8uXrp...',
      HashType: 'SHA256',
      Hash: d.Hash,
    })),
  };
  let dataJson = JSON.stringify({
    aud: ['__VAR_ISS__'],
    iss: '__VAR_CID__',
    iat: '__VAR_NOW__',
    exp: '__VAR_EXP__',
    nbf: 0,
    message: { Data: dataBlock },
  }, null, 4);
  dataJson = dataJson
    .replace('"__VAR_ISS__"', 'pm.environment.get("issuer")')
    .replace('"__VAR_CID__"', 'pm.environment.get("_clientId")')
    .replace('"__VAR_NOW__"', 'now')
    .replace('"__VAR_EXP__"', 'now + 300')
    .replace('"__VAR_QR__"', "(pm.environment.name ? pm.environment : pm.collectionVariables).get('QuoteReference')");
  return [
    "const uuid = require('uuid');",
    'pm.environment.set("interactionId", uuid.v4());',
    'const now = Math.floor(Date.now() / 1000);',
    `const data1 = JSON.stringify(${dataJson});`,
    'pm.environment.set("data", data1);',
  ];
}

function cloneMotorForType(type) {
  let s = JSON.stringify(motor);
  s = s.replace(/"Motor Insurance"/g, `"${type.name} Insurance"`);
  s = s.replace(/Motor New Quote/g, `${type.name} New Quote`);
  s = s.replace(/Motor Renewal Quote/g, `${type.name} Renewal Quote`);
  s = s.replace(/Motor Switch Quote/g, `${type.name} Switch Quote`);
  s = s.replace(/motor-insurance-/g, `${type.lower}-insurance-`);
  const clone = JSON.parse(s);

  for (const sub of clone.item) {
    const scenario = scenarioFromSubfolder(sub.name);
    const tppLed = sub.name.includes('(TPP-Led)');
    const withWebhook = sub.name.includes('TPP subscribes to Webhooks');

    const createQ = sub.item.find(r => r.name.includes('(Create Quote)') && r.request && r.request.method === 'POST');
    if (createQ && createQ.request.body) {
      createQ.request.body.raw = JSON.stringify(type.createBodyBuilder(scenario, tppLed), null, 2);
    }

    const acceptGet = sub.item.find(r => r.name.includes('(Accept Quote)') && r.request && r.request.method === 'GET');
    if (acceptGet) {
      const pre = acceptGet.event.find(e => e.listen === 'prerequest');
      pre.script.exec = buildAcceptQuoteScript(type, { tppLed, withWebhook });
    }

    const kycGet = sub.item.find(r => r.name.includes('(Submit KYC)') && r.request && r.request.method === 'GET');
    if (kycGet) {
      const pre = kycGet.event.find(e => e.listen === 'prerequest');
      pre.script.exec = buildSubmitKycScript(type);
    }
  }

  return clone;
}

const newFolders = TYPES.map(cloneMotorForType);
const motorIdx = quot.item.findIndex(x => x.name === 'Motor Insurance');
quot.item.splice(motorIdx + 1, 0, ...newFolders);

const out = JSON.stringify(doc, null, 2).replace(/\n/g, '\r\n') + '\r\n';
fs.writeFileSync(COLLECTION, out);

console.log('Inserted folders:');
for (const f of newFolders) console.log('  -', f.name, '(' + f.item.length + ' subfolders)');
console.log('Quotation.item length:', quot.item.length);
