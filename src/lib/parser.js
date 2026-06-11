import Papa from 'papaparse';

let products = new Map();

export async function initDatabase() {
  const resp = await fetch('https://dl.dropboxusercontent.com/scl/fi/j30z9sgz1jiygb8fka08p/stock.csv?rlkey=bt72miey1heg920jkynyo8cjt&st=7u26642h&dl=1');

  if (!resp.ok) {
    throw new Error(`failed to fetch CSV: ${resp.status}`);
  }
  const csv = await resp.text();


  const results = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    delimiter: ',',
  });

  for (const row of results.data) {
    const normalizedRow = Object.fromEntries(
      Object.entries(row || {}).map(([key, value]) => [String(key).trim().toLowerCase(), value])
    );

    if (!normalizedRow.part_no) continue;

    const key = String(normalizedRow.part_no);
    normalizedRow.desc = normalizedRow.desc || 'No description';
    normalizedRow.price1 = parseFloat(normalizedRow.price1) || 0;

    products.set(key, normalizedRow);
  }

}


export function getProductByUpc(upc) {
  return products.get(String(upc).trim()) || null;
}

