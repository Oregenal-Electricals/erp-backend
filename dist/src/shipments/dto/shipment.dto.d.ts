export declare class CreateShipmentDto {
    ipoId: string;
    paymentInstrumentId?: string;
    shipmentMode: string;
    carrierName: string;
    vesselName?: string;
    voyageNumber?: string;
    flightNumber?: string;
    blNumber?: string;
    awbNumber?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    etd?: string;
    eta?: string;
    totalPackages?: number;
    totalWeight?: number;
    totalVolume?: number;
    notes?: string;
}
export declare class UpdateShipmentDto {
    carrierName?: string;
    vesselName?: string;
    voyageNumber?: string;
    blNumber?: string;
    awbNumber?: string;
    etd?: string;
    eta?: string;
    atd?: string;
    ata?: string;
    totalPackages?: number;
    totalWeight?: number;
    totalVolume?: number;
    notes?: string;
}
export declare class AddContainerDto {
    containerNumber: string;
    containerType?: string;
    sealNumber?: string;
}
