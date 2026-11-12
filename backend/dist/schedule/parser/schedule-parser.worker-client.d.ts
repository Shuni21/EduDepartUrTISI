import type { ParseScheduleResult } from './excel-grid.parser';
export declare class ScheduleParserWorkerClient {
    parse(buffer: Buffer): Promise<ParseScheduleResult>;
}
