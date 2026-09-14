import { TraceService } from './trace.service';
export declare class TraceController {
    private service;
    constructor(service: TraceService);
    search(q: string, req: any): Promise<any>;
}
