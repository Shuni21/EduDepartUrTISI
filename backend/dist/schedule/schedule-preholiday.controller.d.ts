import { UpdateSchedulePreholidayDayDto } from './dto/schedule-preholiday-day.dto';
import { SchedulePreholidayService } from './schedule-preholiday.service';
export declare class SchedulePreholidayDisplayController {
    private readonly schedulePreholidayService;
    constructor(schedulePreholidayService: SchedulePreholidayService);
    listPreholidayDays(): Promise<string[]>;
}
export declare class SchedulePreholidayAdminController {
    private readonly schedulePreholidayService;
    constructor(schedulePreholidayService: SchedulePreholidayService);
    updatePreholidayDay(dto: UpdateSchedulePreholidayDayDto): Promise<string[]>;
}
