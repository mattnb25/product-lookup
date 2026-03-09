import Papa from 'papaparse';

let productsMap = null;

async function loadProducts() {
  if (productsMap) return productsMap;

  const response = await fetch('/data.csv');
  const csvText = await response.text();

  const map = new Map();
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  for (const row of results.data) {
    if (!row.part_no) continue;

    const key = String(row.part_no).trim();
    row.desc = row.desc?.trim() || "No description";
    row.price1 = parseFloat(row.price1) || 0;

    map.set(key, row);
  }

  productsMap = map;
  return productsMap;
}

export async function getProductByUpc(upc) {
  const products = await loadProducts();
  return products.get(String(upc).trim()) || null;
}