async function test() {
  try {
    const res = await fetch('http://goatedcodoer:8091/items/salesman?limit=1', {
      headers: { 'Authorization': 'Bearer rTilKSsclzuQW8WfQWK1ba8wrD_LetNn' }
    });
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
