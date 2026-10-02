import { ScheduleGateway } from './schedule.gateway';
import type { ScheduleChangedPayload, ScheduleTarget } from './schedule.gateway';
import { ScheduleItem } from './entities/schedule-item.entity';
import { LinkedLessonService } from './linked-lesson.service';
export declare class ScheduleNotifierService {
    private readonly scheduleGateway;
    private readonly linkedLessonService;
    constructor(scheduleGateway: ScheduleGateway, linkedLessonService: LinkedLessonService);
    getTargetsForItems(items: ScheduleItem[]): ScheduleTarget[];
    getTargetsForItemsAndLinkedLessons(items: ScheduleItem[]): Promise<ScheduleTarget[]>;
    notifyScheduleChanged(reason: ScheduleChangedPayload['reason'], targets: ScheduleTarget[]): void;
    notifyPreholidayDaysUpdated(preholidayDays: string[]): void;
}
