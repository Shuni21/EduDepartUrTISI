import { CreateScheduleItemDto, ScheduleItemPreviewDto, ScheduleItemPreviewResultDto, ScheduleTransferRecommendationDto, ScheduleTransferRecommendationQueryDto, UpdateScheduleItemDto, BulkDisableByTeacherDto, BulkDisableResultDto } from './dto/schedule-item.dto';
import { ScheduleAdminService } from './schedule-admin.service';
import { ScheduleDisplayLesson } from './schedule-display.service';
export declare class ScheduleAdminController {
    private readonly scheduleAdminService;
    constructor(scheduleAdminService: ScheduleAdminService);
    createItem(dto: CreateScheduleItemDto): Promise<ScheduleDisplayLesson>;
    bulkDisableByTeacher(dto: BulkDisableByTeacherDto): Promise<BulkDisableResultDto>;
    getTransferRecommendations(id: number, query: ScheduleTransferRecommendationQueryDto): Promise<ScheduleTransferRecommendationDto[]>;
    previewItemChanges(id: number, dto: ScheduleItemPreviewDto): Promise<ScheduleItemPreviewResultDto>;
    getLinkedGroupNames(id: number): Promise<string[]>;
    updateItem(id: number, dto: UpdateScheduleItemDto): Promise<ScheduleDisplayLesson>;
    disableItem(id: number): Promise<void>;
    deleteItem(id: number): Promise<void>;
}
