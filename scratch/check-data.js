const BASE_URL = 'http://100.81.225.79:8086';
const TOKEN = 'rTilKSsclzuQW8WfQWK1ba8wrD_LetNn'; // from test-api.js or .env.local

async function checkEndpoint(endpoint, path) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`Fetching ${endpoint} from ${url}...`);
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      console.log(`Failed to fetch ${endpoint}: status ${res.status}`);
      return;
    }
    const data = await res.json();
    console.log(`\n--- ${endpoint} ---`);
    console.log(`Count: ${Array.isArray(data) ? data.length : typeof data}`);
    const records = Array.isArray(data) ? data : (data.data || []);
    if (records.length > 0) {
      console.log('First Record keys and values:');
      console.log(JSON.stringify(records[0], null, 2));
    } else {
      console.log('No records found.');
    }
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err.message);
  }
}

async function run() {
  await checkEndpoint('sales-report', '/api/view-sales-report-itemized/filtered?startDate=2025-01-01&endDate=2025-12-31');
  await checkEndpoint('accounts-payable', '/api/view-accounts-payable/all?startDate=2025-01-01&endDate=2025-12-31');
  await checkEndpoint('disbursement-itemized', '/api/view-disbursement-itemized/all?startDate=2025-01-01&endDate=2025-12-31');
  await checkEndpoint('ar-per-supplier', '/api/view-ar-per-item-per-supplier/filter?startDate=2025-01-01&endDate=2025-12-31&supplierName=');
  await checkEndpoint('running-inventory', '/api/view-running-inventory-by-unit/all?startDate=2025-01-01&endDate=2025-12-31');
  await checkEndpoint('sales-return', '/api/view-sales-return-per-item-supplier/filter?startDate=2025-01-01&endDate=2025-12-31&supplierName=&productCode=&productName=&returnStatus=');
}

run();
