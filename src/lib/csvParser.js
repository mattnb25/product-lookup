export function parseCsvToBarcodeMap(csvText) {
    const lines = csvText.trim().split('\n');
    const header = lines.shift().split(',').map(s => s.trim());
    const barcodeIndex = header.indexOf('part_no');
    const descIndex = header.indexOf('desc');
    const priceIndex = header.indexOf('price1');

    const barcodeMap = new Map();

    for (const line of lines) {
        const columns = line.split(',');
        if (columns.length >= 3) {
            const barcode = columns[barcodeIndex]?.trim();
            const name = columns[descIndex]?.trim();
            const price = parseFloat(columns[priceIndex]?.trim());
            if (barcode && name && !isNaN(price)) {
                barcodeMap.set(barcode, { name, price });
            }
        }
    }

    return barcodeMap;
}
