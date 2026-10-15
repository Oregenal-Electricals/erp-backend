import {
  parseLooseDate,
  extractCpoNumber,
  extractPoDate,
  extractDeliveryDate,
  extractLineItems,
  parseCpoSourceText,
} from './cpo-source-parser';

describe('cpo-source-parser', () => {
  describe('parseLooseDate()', () => {
    it('parses DD/MM/YYYY', () => {
      expect(parseLooseDate('01/10/2026')).toBe(
        new Date(Date.UTC(2026, 9, 1)).toISOString(),
      );
    });
    it('parses DD-MM-YYYY', () => {
      expect(parseLooseDate('15-11-2026')).toBe(
        new Date(Date.UTC(2026, 10, 15)).toISOString(),
      );
    });
    it('parses "12-Jan-2026"', () => {
      expect(parseLooseDate('12-Jan-2026')).toBe(
        new Date(Date.UTC(2026, 0, 12)).toISOString(),
      );
    });
    it('parses "12 January 2026"', () => {
      expect(parseLooseDate('12 January 2026')).toBe(
        new Date(Date.UTC(2026, 0, 12)).toISOString(),
      );
    });
    it('returns null for unrecognisable text', () => {
      expect(parseLooseDate('whenever is convenient')).toBeNull();
    });
    it('returns null for an invalid calendar date', () => {
      expect(parseLooseDate('31/02/2026')).toBeNull();
    });
  });

  describe('extractCpoNumber()', () => {
    it('reads "PO No: ..."', () => {
      expect(
        extractCpoNumber(
          'Customer: Havells\nPO No: HAV/2026/00123\nDate: 01/10/2026',
        ),
      ).toBe('HAV/2026/00123');
    });
    it('reads "Purchase Order Number ..."', () => {
      expect(
        extractCpoNumber('Purchase Order Number - PO-9981\nSome other line'),
      ).toBe('PO-9981');
    });
    it('returns null when no PO number label is present', () => {
      expect(
        extractCpoNumber('Just some random invoice text with no labels'),
      ).toBeNull();
    });
  });

  describe('extractPoDate() / extractDeliveryDate()', () => {
    it('reads PO Date', () => {
      expect(
        extractPoDate('PO Date: 01/10/2026\nDelivery Date: 15/10/2026'),
      ).toBe(new Date(Date.UTC(2026, 9, 1)).toISOString());
    });
    it('reads Delivery Date', () => {
      expect(
        extractDeliveryDate('PO Date: 01/10/2026\nDelivery Date: 15/10/2026'),
      ).toBe(new Date(Date.UTC(2026, 9, 15)).toISOString());
    });
    it('returns null when absent', () => {
      expect(extractDeliveryDate('No dates here at all')).toBeNull();
    });
  });

  describe('extractLineItems()', () => {
    it('extracts a simple whitespace-separated item table', () => {
      const text = [
        'Item Code   Description               Qty   Rate',
        'BULB-9W-WW  9W LED Bulb Warm White     100   45.50',
        'BULB-9W-CW  9W LED Bulb Cool White     50    46.00',
        'Total                                        9075.00',
      ].join('\n');
      const items = extractLineItems(text);
      expect(items).toEqual([
        {
          itemCode: 'BULB-9W-WW',
          itemName: '9W LED Bulb Warm White',
          qty: 100,
          unitPrice: 45.5,
        },
        {
          itemCode: 'BULB-9W-CW',
          itemName: '9W LED Bulb Cool White',
          qty: 50,
          unitPrice: 46,
        },
      ]);
    });

    it('skips a totals/subtotal line even if numbers line up', () => {
      const items = extractLineItems(
        'Subtotal          Amount payable          1   9075.00',
      );
      expect(items).toEqual([]);
    });

    it('returns an empty array for prose with no tabular rows', () => {
      expect(
        extractLineItems('Dear Sir, please find our order attached. Regards.'),
      ).toEqual([]);
    });

    it('strips a trailing UOM token out of the item name', () => {
      const items = extractLineItems(
        'WIRE-1MM   Copper Wire 1mm PCS   200   12.25',
      );
      expect(items[0].itemName).toBe('Copper Wire 1mm');
    });
  });

  describe('parseCpoSourceText()', () => {
    it('combines all extractors for a realistic simple PO', () => {
      const text = [
        'Havells India Ltd.',
        'PO No: HAV/2026/00123',
        'PO Date: 01/10/2026',
        'Delivery Date: 15/10/2026',
        '',
        'Item Code   Description               Qty   Rate',
        'BULB-9W-WW  9W LED Bulb Warm White     100   45.50',
      ].join('\n');

      expect(parseCpoSourceText(text)).toEqual({
        customerPoNumber: 'HAV/2026/00123',
        poDate: new Date(Date.UTC(2026, 9, 1)).toISOString(),
        deliveryDate: new Date(Date.UTC(2026, 9, 15)).toISOString(),
        items: [
          {
            itemCode: 'BULB-9W-WW',
            itemName: '9W LED Bulb Warm White',
            qty: 100,
            unitPrice: 45.5,
          },
        ],
      });
    });

    it('returns nulls/empty for text with none of the expected shapes', () => {
      expect(parseCpoSourceText('Random unrelated document text.')).toEqual({
        customerPoNumber: null,
        poDate: null,
        deliveryDate: null,
        items: [],
      });
    });
  });
});
