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
export declare function parseLooseDate(raw: string): string | null;
export declare function extractCpoNumber(text: string): string | null;
export declare function extractPoDate(text: string): string | null;
export declare function extractDeliveryDate(text: string): string | null;
export declare function extractLineItems(text: string): CpoParsedItem[];
export declare function parseCpoSourceText(text: string): CpoParsedData;
