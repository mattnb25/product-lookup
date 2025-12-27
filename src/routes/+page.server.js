import { parseCsvToBarcodeMap } from '$lib/csvParser.js';

export async function load({ fetch }) {
    const res = await fetch('/home-tan.csv');
    const csvText = await res.text();

    const lastModifiedHeader = res.headers.get('last-modified');
    const lastModifiedDate = lastModifiedHeader ? new Date(lastModifiedHeader) : new Date();
    const lastModified = lastModifiedDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const barcodeData = parseCsvToBarcodeMap(csvText);

    return { lastModified, barcodeData };
}