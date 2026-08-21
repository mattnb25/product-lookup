import { json } from '@sveltejs/kit';
import Papa from 'papaparse';

const STORES = {
  "Home Tan": "https://dl.dropboxusercontent.com/scl/fi/j30z9sgz1jiygb8fka08p/stock.csv?rlkey=bt72miey1heg920jkynyo8cjt&st=7u26642h&dl=1",
  "Tans Mart": "", 
};

const cache = {};

export async function POST({ request }) {
  const { upc, storeName } = await request.json().catch(() => ({}));
  const url = STORES[storeName];

  if (!url) return json({ error: "Invalid store" }, { status: 400 });
  if (!upc) return json({ success: true, warmed: true }); // Short-circuit warmup instantly

  let store = cache[storeName];
  const now = Date.now();

  if (!store || now - store.lastFetch > 300000) {
    try {
      const res = await fetch(`${url}&_t=${now}`);
      if (!res.ok) throw 1;

      const items = new Map();
      Papa.parse(await res.text(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => String(h).trim().toLowerCase(),
        step: ({ data: { part_no, desc, price1 } }) => {
          if (part_no) items.set(String(part_no).trim(), { desc: desc || 'No description', price1: +price1 || 0 });
        }
      });
      store = cache[storeName] = { lastFetch: now, items };
    } catch {
      return json({ error: "Upstream fetch failed" }, { status: 502 });
    }
  }

  const product = store.items.get(upc);
  return product ? json({ success: true, product }) : json({ success: false }, { status: 404 });
}