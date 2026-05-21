const BASE_URL = 'http://100.81.225.79:8086';
const TOKEN = 'rTilKSsclzuQW8WfQWK1ba8wrD_LetNn';

async function checkEndpoint(path) {
  try {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  } catch (err) {
    return null;
  }
}

async function run() {
  const records = await checkEndpoint('/api/view-sales-report-itemized/filtered?startDate=2026-01-01&endDate=2026-12-31');
  if (!records) return;
  
  const nullOrEmpty = records.filter(r => !r.productSupplier && !r.supplierName);
  
  console.log(`\n=== 17 UNKNOWN SUPPLIER SALES RECORDS IN 2026 ===`);
  const products = {};
  nullOrEmpty.forEach(r => {
    const key = `${r.productName} [Brand: ${r.productBrand}] [Category: ${r.productCategory}]`;
    if (!products[key]) {
      products[key] = { count: 0, totalAmount: 0, sampleInvoiceNo: [] };
    }
    products[key].count++;
    products[key].totalAmount += (r.productNetAmount || r.amount || 0);
    products[key].sampleInvoiceNo.push(r.invoiceNo);
  });
  
  console.log(JSON.stringify(products, null, 2));

  console.log("\nIndividual Transactions of Unknown Suppliers:");
  nullOrEmpty.forEach((r, idx) => {
    console.log(`${idx + 1}. Inv: ${r.invoiceNo} | Date: ${r.invoiceDate} | Product: ${r.productName} | Brand: ${r.productBrand} | Amount: ₱${(r.productNetAmount || r.amount || 0).toLocaleString()}`);
  });
}

run();
