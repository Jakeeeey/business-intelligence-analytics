const BASE_URL = 'http://100.81.225.79:8086';
const TOKEN = 'rTilKSsclzuQW8WfQWK1ba8wrD_LetNn';

async function testEndpoint(label, path) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`\nFetching ${label} from: ${url}`);
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      console.log(`Error ${res.status}: ${await res.text()}`);
      return;
    }
    const data = await res.json();
    const records = Array.isArray(data) ? data : (data.data || data.records || data.items || []);
    console.log(`Returned count: ${records.length}`);
    if (records.length > 0) {
      console.log('Sample record keys:', Object.keys(records[0]));
      // Print min and max dates
      const dates = records.map(r => r.invoiceDate || r.receiptDate || r.transactionDate || r.date).filter(Boolean);
      if (dates.length > 0) {
        dates.sort();
        console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
      } else {
        console.log('No date fields found in records.');
      }
    }
  } catch (err) {
    console.error(`Error ${label}:`, err.message);
  }
}

async function run() {
  console.log('=== TEST WITH dateFrom / dateTo ===');
  await testEndpoint('Sales (dateFrom/dateTo)', '/api/v1/view-sales-report/filter?dateFrom=2025-01-01&dateTo=2025-12-31');
  await testEndpoint('Purchases (dateFrom/dateTo)', '/api/view-purchase-report/filter?dateFrom=2025-01-01&dateTo=2025-12-31');

  console.log('\n=== TEST WITH startDate / endDate ===');
  await testEndpoint('Sales (startDate/endDate)', '/api/v1/view-sales-report/filter?startDate=2025-01-01&endDate=2025-12-31');
  await testEndpoint('Purchases (startDate/endDate)', '/api/view-purchase-report/filter?startDate=2025-01-01&endDate=2025-12-31');

  console.log('\n=== TEST WITH date_from / date_to ===');
  await testEndpoint('Sales (date_from/date_to)', '/api/v1/view-sales-report/filter?date_from=2025-01-01&date_to=2025-12-31');
  await testEndpoint('Purchases (date_from/date_to)', '/api/view-purchase-report/filter?date_from=2025-01-01&date_to=2025-12-31');

  console.log('\n=== TEST WITH NO DATES ===');
  await testEndpoint('Sales (No Dates)', '/api/v1/view-sales-report/filter');
  await testEndpoint('Purchases (No Dates)', '/api/view-purchase-report/filter');
}

run();
