/**
 * Best-effort extraction of CPO fields from the plain text layer of an
 * uploaded customer PO PDF. This is deliberately conservative: a false
 * "successful" extraction that silently creates a wrong order (wrong
 * item code, qty, or price) is worse than no extraction at all, so every
 * extractor here returns null/empty rather than guessing when it isn't
 * reasonably confident.
 *
 * Only ever called on PDFs that have a real text layer (e.g. a PDF saved
 * straight out of Word/Excel/Tally/another ERP). A scanned or
 * photographed PO has no text layer at all and is filtered out earlier
 * by the caller (CustomerPoService.parseSourceFile) - this module never
 * sees it.
 */

export interface CpoParsedItem {
  itemCode: string;
  itemName: string;
  qty: number;
  unitPrice: number;
}

export interface CpoParsedData {
  customerPoNumber: string | null;
  poDate: string | null;
  deliveryDate: string | null;
  items: CpoParsedItem[];
}

const MONTHS: Record<string, number> = {
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

/**
 * Parses the handful of date formats Indian purchase orders actually use
 * in practice (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, and
 * "12-Jan-2026" / "12 Jan 2026" style). Returns an ISO date string, or
 * null if the text doesn't match any of them - never a guess.
 */
export function parseLooseDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (also accepts 2-digit year)
  let m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime()) && d.getUTCMonth() === month)
      return d.toISOString();
    return null;
  }

  // "12-Jan-2026" / "12 Jan 2026" / "12 January 2026"
  m = s.match(/^(\d{1,2})[\s-](\w{3,})[\s-](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthKey = m[2].toLowerCase().slice(0, 3);
    const month = MONTHS[monthKey];
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (month === undefined) return null;
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d.toISOString();
    return null;
  }

  return null;
}

function findLabelValue(text: string, labelPattern: string): string | null {
  const re = new RegExp(`${labelPattern}\\s*[:\\-]?\\s*([^\\n\\r]{2,40})`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

export function extractCpoNumber(text: string): string | null {
  const raw = findLabelValue(
    text,
    '(?:p\\.?\\s*o\\.?\\s*(?:no|number|#)|purchase\\s*order\\s*(?:no|number)|order\\s*(?:no|number))',
  );
  if (!raw) return null;
  // Labels are often followed by other text on the same line
  // (e.g. "PO No: HAV/2026/001  Date: 01/10/2026") - take only the
  // leading code-looking token.
  const m = raw.match(/^([A-Za-z0-9][A-Za-z0-9/\-_.]{2,29})/);
  return m ? m[1] : null;
}

export function extractPoDate(text: string): string | null {
  const raw = findLabelValue(
    text,
    '(?:p\\.?\\s*o\\.?\\s*date|order\\s*date|dated)',
  );
  if (!raw) return null;
  const m = raw.match(
    /^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s-]\w{3,}[\s-]\d{2,4})/,
  );
  return m ? parseLooseDate(m[1]) : null;
}

export function extractDeliveryDate(text: string): string | null {
  const raw = findLabelValue(
    text,
    '(?:delivery\\s*date|delivery\\s*by|required\\s*by|due\\s*date)',
  );
  if (!raw) return null;
  const m = raw.match(
    /^(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{1,2}[\s-]\w{3,}[\s-]\d{2,4})/,
  );
  return m ? parseLooseDate(m[1]) : null;
}

// Strips a trailing UOM word off the end of an item name (e.g. "Copper
// Wire 1mm PCS" -> "Copper Wire 1mm") - anchored to the END of the
// string with a preceding space, not a full-string match, since the
// name itself is more than just the unit.
const TRAILING_UOM =
  /\s+(?:PCS|NOS|NO|PC|UNIT|UNITS|SET|SETS|BOX|BOXES|KG|GM|MTR|MTRS|M|LTR|EA)$/i;

/**
 * Looks for simple tabular item lines: a code, a name, a quantity and a
 * unit price, in that order, separated by whitespace - e.g.
 *   "BULB-9W-WW   9W LED Bulb Warm White   100   45.50"
 * This only catches that common simple case. Multi-line descriptions,
 * columns in a different order, or a layout where pdf-parse has
 * scrambled column order (it does, for some table-heavy PDFs) won't
 * match - those rows are skipped rather than guessed at.
 */
export function extractLineItems(text: string): CpoParsedItem[] {
  const items: CpoParsedItem[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 6) continue;

    const m = trimmed.match(
      /^([A-Za-z0-9][A-Za-z0-9\-/.]{2,24})\s{1,}(.{3,60}?)\s{1,}(\d+(?:\.\d+)?)\s+(?:[A-Za-z]{1,6}\s+)?(?:@\s*)?(\d+(?:\.\d+)?)(?:\s+\d+(?:\.\d+)?)?\s*$/,
    );
    if (!m) continue;

    const [, itemCode, itemNameRaw, qtyStr, priceStr] = m;
    const qty = parseFloat(qtyStr);
    const unitPrice = parseFloat(priceStr);
    const itemName = itemNameRaw.replace(TRAILING_UOM, '').trim();

    // Sanity gates - skip anything that doesn't look like a real item
    // row rather than save garbage. A heading/total/subtotal line will
    // usually fail one of these.
    if (!itemCode || !itemName) continue;
    if (!(qty > 0) || !(unitPrice >= 0)) continue;
    if (/^(total|subtotal|grand|amount|gst|tax|discount)$/i.test(itemCode))
      continue;

    items.push({ itemCode, itemName, qty, unitPrice });
  }

  return items;
}

export function parseCpoSourceText(text: string): CpoParsedData {
  return {
    customerPoNumber: extractCpoNumber(text),
    poDate: extractPoDate(text),
    deliveryDate: extractDeliveryDate(text),
    items: extractLineItems(text),
  };
}
