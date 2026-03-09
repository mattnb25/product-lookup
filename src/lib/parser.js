import Papa from 'papaparse';

let products = new Map();

export async function initDatabase() {
  return new Promise((resolve, reject) => {
    Papa.parse('/data.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      error: (err) => reject(err),
      complete: (results) => {
        for (const row of results.data) {
          if (!row.part_no) continue;

          const key = String(row.part_no).trim();
          row.desc = row.desc?.trim() || "No description";
          row.price1 = parseFloat(row.price1) || 0;

          products.set(key, row);
        }
        resolve();
      }
    });
  });
}

export function getProductByUpc(upc) {
  return products.get(String(upc).trim()) || null;
}

async function formatRelative() {
  const rawDate = await fetch('./last-update.txt').then(r => r.text()).then(t => t.trim()).catch(() => null);
  if (!rawDate) return { timeUpdated: 'unknown', timeColor: 'black' };

  const receivedDate = new Date(rawDate);
  const totalSeconds = Math.floor((new Date() - receivedDate) / 1000);

  // staleness = 0 (fresh) to 1 (30 days/stale)
  const staleness = Math.min(totalSeconds / 2592000, 1);
  const timeColor = `rgb(${Math.floor(staleness * 255)}, 0, 0)`;

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let timeUpdated;
  if (totalSeconds < 60) timeUpdated = 'just now';
  else if (totalSeconds < 3600) timeUpdated = rtf.format(-Math.floor(totalSeconds / 60), 'minute');
  else if (totalSeconds < 86400) timeUpdated = rtf.format(-Math.floor(totalSeconds / 3600), 'hour');
  else timeUpdated = rtf.format(-Math.floor(totalSeconds / 86400), 'day');

  return { timeUpdated, timeColor };
}

const { timeUpdated, timeColor } = await formatRelative();

export { timeUpdated, timeColor };