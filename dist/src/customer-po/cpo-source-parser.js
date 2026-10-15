"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLooseDate = parseLooseDate;
exports.extractCpoNumber = extractCpoNumber;
exports.extractPoDate = extractPoDate;
exports.extractDeliveryDate = extractDeliveryDate;
exports.extractLineItems = extractLineItems;
exports.parseCpoSourceText = parseCpoSourceText;
const MONTHS = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
};
function parseLooseDate(raw) {
    if (!raw)
        return null;
    const s = raw.trim();
    let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
    if (m) {
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        let year = parseInt(m[3], 10);
        if (year < 100)
            year += 2000;
        const d = new Date(Date.UTC(year, month, day));
        if (!isNaN(d.getTime()) && d.getUTCMonth() === month)
            return d.toISOString();
        return null;
    }
    m = s.match(/^(\d{1,2})[\s-](\w{3,})[\s-](\d{2,4})$/);
    if (m) {
        const day = parseInt(m[1], 10);
        const monthKey = m[2].toLowerCase().slice(0, 3);
        const month = MONTHS[monthKey];
        let year = parseInt(m[3], 10);
        if (year < 100)
            year += 2000;
        if (month === undefined)
            return null;
        const d = new Date(Date.UTC(year, month, day));
        if (!isNaN(d.getTime()))
            return d.toISOString();
        return null;
    }
    return null;
}
function findLabelValue(text, labelPattern) {
    const re = new RegExp(`${labelPattern}\\s*[:\\-]?\\s*([^\\n\\r]{2,40})`, 'i');
    const m = text.match(re);
    return m ? m[1].trim() : null;
}
function extractCpoNumber(text) {
    const raw = findLabelValue(text, '(?:p\\.?\\s*o\\.?\\s*(?:no|number|#)|purchase\\s*order\\s*(?:no|number)|order\\s*(?:no|number))');
    if (!raw)
        return null;
    const m = raw.match(/^([A-Za-z0-9][A-Za-z0-9/\-_.]{2,29})/);
    return m ? m[1] : null;
}
function extractPoDate(text) {
    const raw = findLabelValue(text, '(?:p\\.?\\s*o\\.?\\s*date|order\\s*date|dated)');
    if (!raw)
        return null;
    const m = raw.match(/^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s-]\w{3,}[\s-]\d{2,4})/);
    return m ? parseLooseDate(m[1]) : null;
}
function extractDeliveryDate(text) {
    const raw = findLabelValue(text, '(?:delivery\\s*date|delivery\\s*by|required\\s*by|due\\s*date)');
    if (!raw)
        return null;
    const m = raw.match(/^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s-]\w{3,}[\s-]\d{2,4})/);
    return m ? parseLooseDate(m[1]) : null;
}
const TRAILING_UOM = /\s+(?:PCS|NOS|NO|PC|UNIT|UNITS|SET|SETS|BOX|BOXES|KG|GM|MTR|MTRS|M|LTR|EA)$/i;
function extractLineItems(text) {
    const items = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length < 6)
            continue;
        const m = trimmed.match(/^([A-Za-z0-9][A-Za-z0-9\-/.]{2,24})\s{1,}(.{3,60}?)\s{1,}(\d+(?:\.\d+)?)\s+(?:[A-Za-z]{1,6}\s+)?(?:@\s*)?(\d+(?:\.\d+)?)(?:\s+\d+(?:\.\d+)?)?\s*$/);
        if (!m)
            continue;
        const [, itemCode, itemNameRaw, qtyStr, priceStr] = m;
        const qty = parseFloat(qtyStr);
        const unitPrice = parseFloat(priceStr);
        const itemName = itemNameRaw.replace(TRAILING_UOM, '').trim();
        if (!itemCode || !itemName)
            continue;
        if (!(qty > 0) || !(unitPrice >= 0))
            continue;
        if (/^(total|subtotal|grand|amount|gst|tax|discount)$/i.test(itemCode))
            continue;
        items.push({ itemCode, itemName, qty, unitPrice });
    }
    return items;
}
function parseCpoSourceText(text) {
    return {
        customerPoNumber: extractCpoNumber(text),
        poDate: extractPoDate(text),
        deliveryDate: extractDeliveryDate(text),
        items: extractLineItems(text),
    };
}
//# sourceMappingURL=cpo-source-parser.js.map