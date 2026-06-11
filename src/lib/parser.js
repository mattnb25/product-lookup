import Papa from 'papaparse';

let products = new Map();

export async function initDatabase() {
  const resp = await fetch('/data.csv');
  if (!resp.ok) throw new Error(`failed to fetch CSV: ${resp.status}`);
  const csv = await resp.text();

  const results = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
  });

  for (const row of results.data) {
    if (!row.part_no) continue;

    const key = String(row.part_no).trim();
    row.desc = row.desc?.trim() || "No description";
    row.price1 = parseFloat(row.price1) || 0;

    products.set(key, row);
  }
}


export function getProductByUpc(upc) {
  return products.get(String(upc).trim()) || null;
}

