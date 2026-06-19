const BASE_URL = 'http://goatedcodoer:8056';
const TOKEN = 'AAKv73dkIV8DfAIA5vEt3eXVdIebzmBW';

async function checkCollection(name) {
  try {
    const url = `${BASE_URL}/items/${name}?limit=3`;
    console.log(`\nFetching items from ${name}...`);
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
    console.log(`Found ${data.data?.length ?? 0} items.`);
    if (data.data && data.data.length > 0) {
      console.log('Fields available:', Object.keys(data.data[0]));
      console.log('Sample item:', JSON.stringify(data.data[0], null, 2));
    }
  } catch (err) {
    console.error(`Error checking ${name}:`, err.message);
  }
}

async function run() {
  await checkCollection('target_setting_division');
  await checkCollection('target_setting_supplier');
  await checkCollection('target_setting_supervisor');
}

run();
