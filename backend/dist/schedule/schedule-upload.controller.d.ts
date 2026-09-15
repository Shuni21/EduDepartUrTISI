import { Request } from 'express';
import { ScheduleUploadService } from './schedule-upload.service';
interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        login: string;
    };
}
export declare class ScheduleUploadController {
    private readonly scheduleUploadService;
    constructor(scheduleUploadService: ScheduleUploadService);
    listUploads(): Promise<import("./schedule-upload.service").ScheduleUploadResponse[]>;
    previewSchedule(req: AuthenticatedRequest, file: Express.Multer.File | undefined): Promise<import("./schedule-upload.service").SchedulePreviewResponse>;
    confirmSchedule(req: AuthenticatedRequest, file: Express.Multer.File | undefined): Promise<import("./schedule-upload.service").ScheduleUploadResponse>;
    uploadSchedule(req: AuthenticatedRequest, file: Express.Multer.File | undefined): Promise<import("./schedule-upload.service").ScheduleUploadResponse>;
    deleteUpload(id: number): Promise<void>;
}
export {};
