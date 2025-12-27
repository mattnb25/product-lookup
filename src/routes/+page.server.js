import { statSync, readFileSync } from 'node:fs';
import { parseCsvToBarcodeMap } from '$lib/csvParser.js';

export function load() {
    const stats = statSync('./static/home-tan.csv');

    const lastModified = stats.mtime.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const csvText = readFileSync('./static/home-tan.csv', 'utf-8');
    const barcodeData = parseCsvToBarcodeMap(csvText);

    return { lastModified, barcodeData };
}