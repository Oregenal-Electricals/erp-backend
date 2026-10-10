import { BomImportService } from './bom-import.service';

describe('BomImportService - parseRows footer handling', () => {
  let service: BomImportService;

  beforeEach(() => {
    // parseRows is pure row-array -> {product, docInfo, sections} logic
    // with no DB/dependency use, so the constructor args are never
    // touched by this test and can stay undefined.
    service = new BomImportService(undefined as any, undefined as any, undefined as any);
  });

  function callParseRows(rows: any[][]) {
    return (service as any).parseRows(rows);
  }

  const HEADER_ROW = ['S.NO.', 'Part Code', 'Description', 'Package', 'Quantity', 'Location', 'Preferred Make', 'Alternate Makes'];

  it('stops at an UPPERCASE "PREPARED BY / CHECKED BY" footer row instead of importing it as a bogus section', () => {
    const rows = [
      HEADER_ROW,
      [1, 'ABC001', 'Resistor 10K', 'Box', '5 PCS', null, 'MakeA', 'MakeB'],
      [2, 'ABC002', 'Capacitor 100uF', 'Box', '2 PCS', null, 'MakeC', 'MakeD'],
      ['PREPARED BY: CHECKED BY: VERIFIED BY: CHECKED BY:', null, null, null, null, null, null, null],
    ];

    const { sections } = callParseRows(rows);

    const sectionNames = sections.map((s: any) => s.name);
    expect(sectionNames).not.toContain('PREPARED BY: CHECKED BY: VERIFIED BY: CHECKED BY:');
    const totalItems = sections.reduce((n: number, s: any) => n + s.items.length, 0);
    expect(totalItems).toBe(2);
  });

  it('still stops on the original mixed-case footer text', () => {
    const rows = [
      HEADER_ROW,
      [1, 'ABC001', 'Resistor 10K', 'Box', '5 PCS', null, 'MakeA', 'MakeB'],
      ['Prepared By: ____  Checked By: ____', null, null, null, null, null, null, null],
    ];

    const { sections } = callParseRows(rows);
    const totalItems = sections.reduce((n: number, s: any) => n + s.items.length, 0);
    expect(totalItems).toBe(1);
  });

  it('still recognizes a real section header row (text-only first cell, not a footer marker)', () => {
    const rows = [
      HEADER_ROW,
      ['PACKING PART', null, null, null, null, null, null, null],
      [1, 'KPCGHLNP247', 'MONO BOX 12W INV.', 'PCS', '1 PCS', null, 'Rahul Packaging', 'Manik Printing'],
    ];

    const { sections } = callParseRows(rows);
    expect(sections.map((s: any) => s.name)).toEqual(['PACKING PART']);
    expect(sections[0].items).toHaveLength(1);
  });
});
