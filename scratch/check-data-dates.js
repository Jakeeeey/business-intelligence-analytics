const BASE_URL = 'http://100.81.225.79:8086';
const TOKEN = 'rTilKSsclzuQW8WfQWK1ba8wrD_LetNn'; // from test-api.js or .env.local

async function checkSalesReportDates() {
  try {
    const url = `${BASE_URL}/api/view-sales-report-itemized/filtered?startDate=2024-01-01&endDate=2026-12-31`;
    console.log(`Fetching sales-report from ${url}...`);
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      console.log(`Failed to fetch: status ${res.status}`);
      return;
    }
    const data = await res.json();
    const records = Array.isArray(data) ? data : (data.data || []);
    console.log(`Fetched ${records.length} records.`);
    if (records.length === 0) return;

    // Summarize years and months
    const dateCounts = {};
    records.forEach(r => {
      const dateStr = r.invoiceDate || r.transactionDate || r.lineDate;
      if (!dateStr) return;
      const yearMonth = dateStr.slice(0, 7); // e.g. "2025-05"
      dateCounts[yearMonth] = (dateCounts[yearMonth] || 0) + 1;
    });

    console.log('Unique Year-Months in Sales Report:');
    console.log(JSON.stringify(dateCounts, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSalesReportDates();
